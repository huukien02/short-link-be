import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickEvent } from '../links/click-event.entity';

export interface ClickContext {
  referrer?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectRepository(ClickEvent)
    private readonly eventsRepo: Repository<ClickEvent>,
  ) {}

  /**
   * Ghi click event — gọi fire-and-forget, KHÔNG để chặn redirect.
   * Phase 3: thay bằng queue (BullMQ) + enrich geo/device.
   */
  recordClick(linkId: string, ctx: ClickContext): void {
    const event = this.eventsRepo.create({
      linkId,
      referrer: ctx.referrer ?? null,
      // device/browser/country sẽ enrich ở Phase 3
      device: null,
      browser: null,
      country: null,
    });

    void this.eventsRepo.save(event).catch((err) => {
      this.logger.error(`Ghi click event thất bại: ${err}`);
    });
  }
}
