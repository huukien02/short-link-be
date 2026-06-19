import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Bảng rollup: số click gộp theo (link, ngày, quốc gia, thiết bị).
 * Được sinh từ `click_events` bởi cron rollup (AnalyticsRollupService).
 * Mục đích: truy vấn analytics nhanh, không phải quét bảng click_events thô.
 *
 * country/device để NOT NULL ('unknown' khi thiếu) để unique index hoạt động
 * (Postgres coi NULL khác NULL → sẽ phá tính duy nhất nếu để nullable).
 */
@Entity('daily_stats')
@Index(['linkId', 'date'])
@Index(['linkId', 'date', 'country', 'device'], { unique: true })
export class DailyStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  linkId: string;

  @Column({ type: 'date' })
  date: string; // 'YYYY-MM-DD'

  @Column({ default: 'unknown' })
  country: string;

  @Column({ default: 'unknown' })
  device: string;

  @Column({ type: 'int', default: 0 })
  count: number;
}
