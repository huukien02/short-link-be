import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { PAID_PLANS, PlanConfig } from './plans.config';

/**
 * Bọc toàn bộ tương tác Stripe. Controller chỉ gọi service này
 * (giữ controller mỏng theo quy ước backend).
 *
 * Mô hình: Checkout (hosted) + Billing Portal (hosted) + Webhook.
 * ⭐ Webhook là NGUỒN SỰ THẬT duy nhất để đổi `plan` — không bao giờ nâng gói
 * dựa trên callback success_url (user có thể không quay lại / giả mạo).
 *
 * Seeder: lúc khởi động tự tạo Product/Price trên Stripe nếu chưa có
 * (idempotent qua `lookup_key`) → khỏi cần điền price id thủ công vào env.
 */
@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  // Trạng thái subscription được coi là "đang dùng được" gói trả phí.
  private readonly ACTIVE_STATUSES = ['active', 'trialing'];

  // Registry: planKey → Stripe price id, điền bởi seeder lúc khởi động.
  private readonly priceIds = new Map<string, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {
    const secretKey = this.requireConfig('STRIPE_SECRET_KEY');
    // Không ghim apiVersion → dùng version pinned mặc định của SDK (tránh lệch type).
    this.stripe = new Stripe(secretKey);

    // KHÔNG log secret, chỉ log mode + env đã nạp đủ chưa.
    const mode = secretKey.startsWith('sk_live') ? 'LIVE' : 'TEST';
    this.logger.log(
      `[init] Stripe mode=${mode} | ` +
        `WEBHOOK_SECRET=${this.config.get('STRIPE_WEBHOOK_SECRET') ? 'set' : 'MISSING'}`,
    );
  }

  /** Seed gói lúc khởi động — resilient: lỗi Stripe KHÔNG làm sập app. */
  async onModuleInit(): Promise<void> {
    await this.seedPlans();
  }

  // ============ Seeder ============

  private async seedPlans(): Promise<void> {
    for (const plan of PAID_PLANS) {
      try {
        const priceId = await this.ensurePrice(plan);
        this.priceIds.set(plan.key, priceId);
        this.logger.log(
          `[seed] ${plan.key} → price=${priceId} ` +
            `(${plan.amount} ${plan.currency}/${plan.interval})`,
        );
      } catch (err) {
        // Vẫn cho app chạy; checkout gói lỗi sẽ báo "không khả dụng".
        this.logStripeError('seed', err, { plan: plan.key });
      }
    }
    this.logger.log(
      `[seed] Hoàn tất: ${this.priceIds.size}/${PAID_PLANS.length} gói sẵn sàng`,
    );
  }

  /** Tìm price theo lookup_key, chưa có thì tạo Product (nếu cần) + Price. */
  private async ensurePrice(plan: PlanConfig): Promise<string> {
    const existing = await this.stripe.prices.list({
      lookup_keys: [plan.lookupKey!],
      active: true,
      limit: 1,
    });
    if (existing.data.length) {
      return existing.data[0].id;
    }

    const productId = await this.ensureProduct(plan);
    const price = await this.stripe.prices.create({
      product: productId,
      currency: plan.currency!,
      unit_amount: plan.amount!,
      recurring: { interval: plan.interval! },
      lookup_key: plan.lookupKey!,
    });
    this.logger.log(`[seed] Tạo price mới ${price.id} cho gói ${plan.key}`);
    return price.id;
  }

  /** Tìm product theo metadata app_plan, chưa có thì tạo mới. */
  private async ensureProduct(plan: PlanConfig): Promise<string> {
    const products = await this.stripe.products.list({ active: true, limit: 100 });
    const found = products.data.find((p) => p.metadata?.app_plan === plan.key);
    if (found) return found.id;

    const created = await this.stripe.products.create({
      name: `URL Shortener ${plan.name}`,
      metadata: { app_plan: plan.key },
    });
    this.logger.log(`[seed] Tạo product mới ${created.id} cho gói ${plan.key}`);
    return created.id;
  }

  // ============ Checkout / Portal ============

  /** Tạo Checkout Session cho `planKey`, trả URL hosted để FE redirect tới. */
  async createCheckoutSession(userId: string, planKey: string): Promise<string> {
    this.logger.log(`[checkout] Bắt đầu user=${userId} plan=${planKey}`);

    const priceId = this.priceIds.get(planKey);
    if (!priceId) {
      this.logger.warn(
        `[checkout] Gói "${planKey}" chưa sẵn sàng (seed thất bại?) user=${userId}`,
      );
      throw new BadRequestException(`Gói "${planKey}" không khả dụng`);
    }

    const user = await this.users.findById(userId);
    if (!user) {
      this.logger.warn(`[checkout] User không tồn tại: user=${userId}`);
      throw new BadRequestException('User không tồn tại');
    }

    const customerId = await this.ensureCustomer(user);
    const frontend = this.frontendUrl();

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        // Gắn planKey để webhook biết chính xác user mua gói nào.
        metadata: { app_plan: planKey, userId },
        subscription_data: { metadata: { app_plan: planKey, userId } },
        success_url: `${frontend}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontend}/billing/cancel`,
      });

      if (!session.url) {
        this.logger.error(
          `[checkout] Stripe không trả URL: session=${session.id} user=${userId}`,
        );
        throw new InternalServerErrorException(
          'Stripe không trả về URL checkout',
        );
      }

      this.logger.log(
        `[checkout] Tạo session OK: session=${session.id} customer=${customerId} ` +
          `plan=${planKey} user=${userId}`,
      );
      return session.url;
    } catch (err) {
      this.logStripeError('checkout', err, { userId, customerId, plan: planKey });
      throw err;
    }
  }

  /** Tạo Billing Portal Session (user tự đổi gói / hủy / cập nhật thẻ). */
  async createPortalSession(userId: string): Promise<string> {
    this.logger.log(`[portal] Bắt đầu cho user=${userId}`);

    const user = await this.users.findById(userId);
    if (!user?.stripeCustomerId) {
      this.logger.warn(`[portal] User chưa có stripeCustomerId: user=${userId}`);
      throw new BadRequestException('Tài khoản chưa có thông tin thanh toán');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${this.frontendUrl()}/billing`,
      });
      this.logger.log(
        `[portal] Tạo session OK: customer=${user.stripeCustomerId} user=${userId}`,
      );
      return session.url;
    } catch (err) {
      this.logStripeError('portal', err, {
        userId,
        customerId: user.stripeCustomerId,
      });
      throw err;
    }
  }

  // ============ Webhook ============

  /** Verify chữ ký webhook bằng raw body — ném lỗi nếu không hợp lệ. */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.requireConfig('STRIPE_WEBHOOK_SECRET'),
    );
  }

  /** Xử lý webhook event đã verify → đồng bộ trạng thái gói vào DB. */
  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`[webhook] Nhận event=${event.type} id=${event.id}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        this.logger.log(
          `[webhook] checkout.session.completed session=${session.id} ` +
            `customer=${String(session.customer)} sub=${String(session.subscription)} ` +
            `payment_status=${session.payment_status}`,
        );
        if (session.subscription) {
          const sub = await this.stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await this.applyFromSubscription(sub, event.type);
        } else {
          this.logger.warn(
            `[webhook] session ${session.id} không kèm subscription — bỏ qua`,
          );
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await this.applyFromSubscription(event.data.object, event.type);
        break;
      }
      default:
        this.logger.debug(`[webhook] Bỏ qua event không quan tâm: ${event.type}`);
    }

    this.logger.log(`[webhook] Xử lý xong event=${event.type} id=${event.id}`);
  }

  /** Map trạng thái subscription Stripe → cột billing của user. */
  private async applyFromSubscription(
    sub: Stripe.Subscription,
    source: string,
  ): Promise<void> {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    const isActive = this.ACTIVE_STATUSES.includes(sub.status);
    // Còn hiệu lực → lấy gói từ metadata (chắc chắn nhất), fallback theo price id.
    const plan = isActive
      ? sub.metadata?.app_plan ??
        this.planKeyForPrice(sub.items.data[0]?.price?.id) ??
        'pro'
      : 'free';

    const periodEnd = sub.items.data[0]?.current_period_end ?? null;

    this.logger.log(
      `[sub] Áp trạng thái (từ ${source}): sub=${sub.id} customer=${customerId} ` +
        `status=${sub.status} → plan=${plan} ` +
        `periodEnd=${periodEnd ? new Date(periodEnd * 1000).toISOString() : 'null'}`,
    );

    const result = await this.users.applySubscription(customerId, {
      plan,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    });

    if (!result.affected) {
      // Quan trọng trên prod: customer Stripe không khớp user nào trong DB
      // (thường do lệch môi trường test/live hoặc DB bị reset). Cần điều tra.
      this.logger.error(
        `[sub] KHÔNG khớp user cho customer=${customerId} (sub=${sub.id}) — ` +
          `gói KHÔNG được cập nhật. Kiểm tra môi trường Stripe (test/live) và DB.`,
      );
    } else {
      this.logger.log(
        `[sub] DB cập nhật OK: customer=${customerId} → plan=${plan} (${sub.status})`,
      );
    }
  }

  /** Tra ngược planKey từ price id (dùng registry seed). */
  private planKeyForPrice(priceId: string | undefined): string | undefined {
    if (!priceId) return undefined;
    for (const [key, id] of this.priceIds) {
      if (id === priceId) return key;
    }
    return undefined;
  }

  // ============ Helpers ============

  /** Lấy hoặc tạo lazy Stripe Customer cho user rồi lưu lại id. */
  private async ensureCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) {
      this.logger.log(
        `[customer] Dùng lại customer=${user.stripeCustomerId} user=${user.id}`,
      );
      return user.stripeCustomerId;
    }

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      await this.users.setStripeCustomerId(user.id, customer.id);
      this.logger.log(`[customer] Tạo customer mới=${customer.id} user=${user.id}`);
      return customer.id;
    } catch (err) {
      this.logStripeError('customer', err, { userId: user.id });
      throw err;
    }
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  private requireConfig(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`Thiếu cấu hình bắt buộc: ${key}`);
    }
    return value;
  }

  /** Log lỗi Stripe với đủ ngữ cảnh để điều tra trên production. */
  private logStripeError(
    scope: string,
    err: unknown,
    ctx: Record<string, string | undefined>,
  ): void {
    const meta = Object.entries(ctx)
      .map(([k, v]) => `${k}=${v ?? '∅'}`)
      .join(' ');
    if (err instanceof Stripe.errors.StripeError) {
      this.logger.error(
        `[${scope}] Stripe lỗi (${err.type}/${err.code ?? 'no-code'}): ${err.message} | ${meta}`,
      );
    } else {
      this.logger.error(`[${scope}] Lỗi không xác định: ${String(err)} | ${meta}`);
    }
  }

  /** Cho health-check / debug: gói nào đã seed xong price. */
  seededPlans(): string[] {
    return [...this.priceIds.keys()];
  }
}
