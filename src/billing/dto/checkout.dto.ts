import { IsIn } from 'class-validator';
import { PAID_PLAN_KEYS } from '../plans.config';

export class CheckoutDto {
  /** Gói muốn mua — chỉ nhận các gói trả phí (pro | business). */
  @IsIn(PAID_PLAN_KEYS, {
    message: `plan phải là một trong: ${PAID_PLAN_KEYS.join(', ')}`,
  })
  plan: string;
}
