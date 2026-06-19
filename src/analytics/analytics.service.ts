import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickEvent } from '../links/click-event.entity';
import { Link } from '../links/link.entity';
import { DailyStat } from './daily-stat.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

export interface AnalyticsResult {
  slug: string;
  from: string;
  to: string;
  total: number;
  byDay: Array<{ date: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
}

/** Một dòng gộp thô: (ngày, quốc gia, thiết bị, số click). */
interface StatRow {
  date: string;
  country: string;
  device: string;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Link)
    private readonly linksRepo: Repository<Link>,
    @InjectRepository(DailyStat)
    private readonly statsRepo: Repository<DailyStat>,
    @InjectRepository(ClickEvent)
    private readonly eventsRepo: Repository<ClickEvent>,
  ) {}

  /**
   * Thống kê 1 link theo slug. Verify ownership (chỉ chủ link).
   *
   * Nguồn dữ liệu (lambda: batch + speed):
   * - Ngày cũ (≤ hôm qua): đọc bảng rollup `daily_stats` — nhanh.
   * - Hôm nay: đọc thẳng `click_events` — TỨC THÌ (không đợi cron rollup mỗi giờ).
   */
  async getBySlug(
    ownerId: string,
    slug: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsResult> {
    const link = await this.linksRepo.findOne({ where: { slug, ownerId } });
    if (!link) throw new NotFoundException('Không tìm thấy link');

    const today = this.todayStr();
    const to = query.to ?? today;
    const from = query.from ?? this.daysAgoStr(30);

    const rows: StatRow[] = [];

    // 1) Phần lịch sử từ daily_stats — chỉ tới hết NGÀY HÔM QUA (today loại ra để lấy live).
    const histTo = to < today ? to : this.yesterdayStr(today);
    if (from <= histTo) {
      const hist = await this.statsRepo
        .createQueryBuilder('s')
        .select(['s.date AS date', 's.country AS country', 's.device AS device', 's.count AS count'])
        .where('s.linkId = :linkId', { linkId: link.id })
        .andWhere('s.date BETWEEN :from AND :histTo', { from, histTo })
        .getRawMany<{ date: string | Date; country: string; device: string; count: string }>();
      for (const r of hist) {
        rows.push({
          date: this.dateOnly(r.date),
          country: r.country,
          device: r.device,
          count: Number(r.count),
        });
      }
    }

    // 2) Hôm nay live từ click_events (nếu khoảng thời gian bao gồm hôm nay).
    if (from <= today && today <= to) {
      const live = await this.eventsRepo
        .createQueryBuilder('e')
        .select(`("e"."createdAt" AT TIME ZONE 'UTC')::date`, 'date')
        .addSelect(`COALESCE("e"."country", 'unknown')`, 'country')
        .addSelect(`COALESCE("e"."device", 'unknown')`, 'device')
        .addSelect('COUNT(*)', 'count')
        .where('e.linkId = :linkId', { linkId: link.id })
        .andWhere(`("e"."createdAt" AT TIME ZONE 'UTC')::date = :today`, { today })
        .groupBy('1')
        .addGroupBy('2')
        .addGroupBy('3')
        .getRawMany<{ date: string | Date; country: string; device: string; count: string }>();
      for (const r of live) {
        rows.push({
          date: this.dateOnly(r.date),
          country: r.country,
          device: r.device,
          count: Number(r.count),
        });
      }
    }

    return {
      slug,
      from,
      to,
      total: rows.reduce((s, r) => s + r.count, 0),
      byDay: this.groupSum(rows, 'date').map(([date, count]) => ({ date, count })),
      byCountry: this.groupSum(rows, 'country').map(([country, count]) => ({
        country,
        count,
      })),
      byDevice: this.groupSum(rows, 'device').map(([device, count]) => ({
        device,
        count,
      })),
    };
  }

  /** Gộp tổng count theo 1 khoá; trả [key, total] sắp xếp (ngày tăng dần, còn lại giảm dần). */
  private groupSum(
    rows: StatRow[],
    key: 'date' | 'country' | 'device',
  ): Array<[string, number]> {
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r[key], (map.get(r[key]) ?? 0) + r.count);
    }
    const entries = [...map.entries()];
    return key === 'date'
      ? entries.sort((a, b) => a[0].localeCompare(b[0]))
      : entries.sort((a, b) => b[1] - a[1]);
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private yesterdayStr(today: string): string {
    return new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  private daysAgoStr(n: number): string {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  /** date column có thể trả Date hoặc string tuỳ driver → chuẩn hoá 'YYYY-MM-DD'. */
  private dateOnly(d: string | Date): string {
    return typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10);
  }
}
