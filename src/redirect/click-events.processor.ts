import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { Repository } from 'typeorm';
import { ClickEvent } from '../links/click-event.entity';
import { CLICK_EVENTS_QUEUE, ClickJobData } from './click-events.queue';

/** Một job đang chờ ghi: giữ resolve/reject để ack sau khi batch insert xong. */
interface Pending {
  data: ClickJobData;
  resolve: () => void;
  reject: (err: unknown) => void;
}

/**
 * Worker đọc job từ queue 'click-events' → enrich (geo/device/browser) → BATCH INSERT.
 *
 * Cách batch giữ đúng độ tin cậy của BullMQ:
 * - process() KHÔNG ghi ngay; nó đẩy job vào buffer rồi trả về 1 Promise CHƯA resolve.
 * - Job vì thế vẫn "active" (đang khoá) cho tới khi cả lô insert xong mới resolve.
 * - Nếu app crash giữa chừng → các job chưa resolve không bị mất, BullMQ retry.
 *
 * Flush khi: đủ BATCH_SIZE job, hoặc sau BATCH_MS kể từ job đầu tiên của lô.
 * concurrency phải ≥ BATCH_SIZE để đủ job active cùng lúc.
 */
@Processor(CLICK_EVENTS_QUEUE, { concurrency: 50 })
export class ClickEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(ClickEventsProcessor.name);

  private readonly BATCH_SIZE = 20;
  private readonly BATCH_MS = 1000;
  private buffer: Pending[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(ClickEvent)
    private readonly eventsRepo: Repository<ClickEvent>,
  ) {
    super();
  }

  process(job: Job<ClickJobData>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.buffer.push({ data: job.data, resolve, reject });
      if (this.buffer.length >= this.BATCH_SIZE) {
        void this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => void this.flush(), this.BATCH_MS);
      }
    });
  }

  /** Gom buffer hiện tại → 1 INSERT nhiều dòng, rồi ack toàn bộ job trong lô. */
  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];

    const rows = batch.map((p) => this.enrich(p.data));
    try {
      await this.eventsRepo.insert(rows); // 1 INSERT cho cả lô
      batch.forEach((p) => p.resolve());
      this.logger.debug(`Batch insert ${rows.length} click_events`);
    } catch (err) {
      this.logger.error(`Batch insert lỗi (${rows.length} job sẽ retry): ${err}`);
      batch.forEach((p) => p.reject(err)); // job fail → BullMQ retry
    }
  }

  /** Từ payload click → dòng ClickEvent đã enrich geo + device/browser. */
  private enrich(data: ClickJobData): Partial<ClickEvent> {
    const ua = data.userAgent ? new UAParser(data.userAgent).getResult() : null;
    const geo = data.ip ? geoip.lookup(data.ip) : null;

    return {
      linkId: data.linkId,
      referrer: data.referrer ?? null,
      country: geo?.country ?? null, // mã ISO quốc gia, vd "VN"
      device: ua?.device.type ?? 'desktop', // ua-parser để trống type với desktop
      browser: ua?.browser.name ?? null,
    };
  }
}
