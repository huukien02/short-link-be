/**
 * Nguồn sự thật duy nhất cho các gói cước — dùng chung cho:
 *  - Seeder Stripe (tạo Product/Price lúc khởi động).
 *  - Enforce giới hạn ở LinksService.
 *  - Map subscription → plan ở webhook.
 *
 * Đổi giá / giới hạn ở đây. Lưu ý: Price trên Stripe BẤT BIẾN — khi đổi `amount`
 * hãy đổi luôn `lookupKey` (vd 'pro_monthly_v2') để seeder tạo price mới.
 */
export interface PlanConfig {
  /** Khớp với cột `User.plan`. */
  key: string;
  name: string;
  /** Có thu phí qua Stripe không (Free = false, không tạo Product/Price). */
  paid: boolean;

  // ==== Chỉ dành cho gói trả phí (paid = true) ====
  /** Số tiền. VND là zero-decimal → 49000 = 49.000₫. */
  amount?: number;
  currency?: string;
  interval?: 'month' | 'year';
  /** Khóa duy nhất để seed idempotent (tìm price theo lookup_key). */
  lookupKey?: string;

  // ==== Giới hạn (enforce ở LinksService) ====
  /** Số link tối đa. `null` = không giới hạn. */
  maxLinks: number | null;
  /** Cho phép custom slug. */
  customSlug: boolean;
  /** Cho phép đặt mật khẩu link. */
  password: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    key: 'free',
    name: 'Free',
    paid: false,
    maxLinks: 10,
    customSlug: false,
    password: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    paid: true,
    amount: 49_000,
    currency: 'vnd',
    interval: 'month',
    lookupKey: 'pro_monthly',
    maxLinks: 1000,
    customSlug: true,
    password: true,
  },
  {
    key: 'business',
    name: 'Business',
    paid: true,
    amount: 149_000,
    currency: 'vnd',
    interval: 'month',
    lookupKey: 'business_monthly',
    maxLinks: null, // không giới hạn
    customSlug: true,
    password: true,
  },
];

export const PLAN_BY_KEY = new Map(PLANS.map((p) => [p.key, p]));
export const PAID_PLANS = PLANS.filter((p) => p.paid);
/** Các key gói trả phí — dùng validate input checkout. */
export const PAID_PLAN_KEYS = PAID_PLANS.map((p) => p.key);

/** Gói mặc định khi user chưa/không có gói hợp lệ. */
export function planOf(key: string | null | undefined): PlanConfig {
  return PLAN_BY_KEY.get(key ?? 'free') ?? PLAN_BY_KEY.get('free')!;
}
