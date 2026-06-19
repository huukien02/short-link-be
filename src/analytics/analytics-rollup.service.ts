import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Gộp `click_events` → `daily_stats` theo (link, ngày, quốc gia, thiết bị).
 * Idempotent theo ngày: xoá rồi insert lại cho đúng ngày đó → chạy lại nhiều lần vẫn đúng.
 */
@Injectable()
export class AnalyticsRollupService {
  private readonly logger = new Logger(AnalyticsRollupService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Cron mỗi giờ: rollup hôm nay + hôm qua (bắt kịp dữ liệu mới). */
  @Cron(CronExpression.EVERY_HOUR, { name: 'rollup-daily-stats' })
  async handleCron(): Promise<void> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    await this.rollupDay(this.toDateStr(today));
    await this.rollupDay(this.toDateStr(yesterday));
  }

  /** Rollup 1 ngày (UTC) — xoá bản cũ rồi insert lại từ click_events. */
  async rollupDay(date: string): Promise<number> {
    const affected = await this.dataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM daily_stats WHERE date = $1`, [date]);
      const res: Array<{ inserted: string }> = await manager.query(
        `INSERT INTO daily_stats ("linkId", date, country, device, count)
         SELECT "linkId",
                ("createdAt" AT TIME ZONE 'UTC')::date AS d,
                COALESCE(country, 'unknown'),
                COALESCE(device, 'unknown'),
                COUNT(*)::int
         FROM click_events
         WHERE ("createdAt" AT TIME ZONE 'UTC')::date = $1
         GROUP BY "linkId", d, COALESCE(country, 'unknown'), COALESCE(device, 'unknown')
         RETURNING 1 AS inserted`,
        [date],
      );
      return res.length;
    });
    if (affected > 0) {
      this.logger.log(`Rollup ${date}: ${affected} dòng daily_stats`);
    }
    return affected;
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }
}
