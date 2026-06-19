import { Controller, Headers, Logger, Post, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { BillingService } from './billing.service';

/**
 * Webhook Stripe — KHÔNG có JwtAuthGuard (Stripe gọi vào, không phải user).
 *
 * 2 lưu ý đặc thù dự án:
 *  1. Cần RAW body để verify chữ ký → bật `rawBody: true` ở main.ts, đọc `req.rawBody`.
 *  2. Dùng `@Res()` trả thẳng để BỎ QUA TransformInterceptor (Stripe chỉ cần 200 trơn,
 *     không phải envelope {success,data}).
 */
@Controller('billing')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly billing: BillingService) {}

  @Post('webhook')
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ): Promise<void> {
    if (!req.rawBody) {
      this.logger.warn('[webhook] Thiếu rawBody — kiểm tra rawBody:true ở main.ts');
      res.status(400).send('Thiếu raw body (kiểm tra rawBody ở main.ts)');
      return;
    }

    this.logger.log(
      `[webhook] Nhận request (${req.rawBody.length} bytes, ` +
        `signature=${signature ? 'có' : 'THIẾU'})`,
    );

    let event: Stripe.Event;
    try {
      event = this.billing.constructEvent(req.rawBody, signature);
    } catch (err) {
      // Sai chữ ký = sai STRIPE_WEBHOOK_SECRET hoặc body bị middleware sửa.
      this.logger.error(
        `[webhook] Chữ ký KHÔNG hợp lệ (kiểm tra STRIPE_WEBHOOK_SECRET): ${String(err)}`,
      );
      res.status(400).send('Invalid signature');
      return;
    }

    try {
      await this.billing.handleEvent(event);
    } catch (err) {
      // 5xx để Stripe tự retry theo cơ chế của họ.
      this.logger.error(
        `[webhook] Xử lý event=${event.type} id=${event.id} lỗi: ${String(err)}`,
      );
      res.status(500).send('Webhook handler failed');
      return;
    }

    this.logger.log(`[webhook] Trả 200 OK cho event=${event.type} id=${event.id}`);
    res.json({ received: true });
  }
}
