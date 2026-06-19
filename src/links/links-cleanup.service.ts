import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LinksService } from './links.service';

/**
 * Job định kỳ dọn link hết hạn → đánh dấu `isActive = false`.
 *
 * Lưu ý: redirect đã tự chặn link hết hạn ngay tại thời điểm truy cập
 * (xem RedirectController.assertUsable), nên job này chỉ để "dọn nền":
 * giữ dữ liệu sạch, giúp dashboard hiển thị đúng trạng thái, và tránh quét
 * link chết khi sau này thêm cache/analytics.
 */
@Injectable()
export class LinksCleanupService {
  private readonly logger = new Logger(LinksCleanupService.name);

  constructor(private readonly links: LinksService) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'deactivate-expired-links' })
  async handleCron(): Promise<void> {
    const affected = await this.links.deactivateExpired();
    if (affected > 0) {
      this.logger.log(`Đã tắt ${affected} link hết hạn`);
    }
  }
}
