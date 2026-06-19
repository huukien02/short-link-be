import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CLICK_EVENTS_QUEUE, ClickJobData } from './click-events.queue';

export interface ClickContext {
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectQueue(CLICK_EVENTS_QUEUE)
    private readonly queue: Queue<ClickJobData>,
  ) {}

  /**
   * Đẩy click event vào queue — fire-and-forget, KHÔNG chặn redirect.
   * Worker (ClickEventsProcessor) sẽ ghi vào DB + (sau này) enrich geo/device.
   */
  recordClick(linkId: string, ctx: ClickContext): void {
    void this.queue
      .add(
        'click',
        {
          linkId,
          referrer: ctx.referrer ?? null,
          userAgent: ctx.userAgent ?? null,
          ip: ctx.ip ?? null,
        },
        {
          removeOnComplete: 1000, // giữ tối đa 1000 job xong, tránh phình Redis
          removeOnFail: 5000,
          attempts: 3, // retry nếu worker lỗi
          backoff: { type: 'exponential', delay: 1000 },
        },
      )
      .catch((err) => {
        this.logger.error(`Enqueue click event thất bại: ${err}`);
      });
  }
}
