import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';

/**
 * Endpoint billing cần đăng nhập. Controller mỏng: chỉ chuyển user.id xuống
 * service và trả `{ url }` để FE tự redirect sang trang hosted của Stripe.
 */
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Bắt đầu mua gói (pro | business) → trả URL Checkout hosted. */
  @Post('checkout')
  async checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    const url = await this.billing.createCheckoutSession(user.id, dto.plan);
    return { url };
  }

  /** Mở Customer Portal (đổi gói / hủy / cập nhật thẻ). */
  @Post('portal')
  async portal(@CurrentUser() user: AuthUser) {
    const url = await this.billing.createPortalSession(user.id);
    return { url };
  }
}
