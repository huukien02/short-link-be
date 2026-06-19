import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClickEvent } from '../links/click-event.entity';
import { LinksModule } from '../links/links.module';
import { ClickEventsProcessor } from './click-events.processor';
import { CLICK_EVENTS_QUEUE } from './click-events.queue';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClickEvent]),
    BullModule.registerQueue({ name: CLICK_EVENTS_QUEUE }),
    LinksModule,
  ],
  controllers: [RedirectController],
  providers: [RedirectService, ClickEventsProcessor],
})
export class RedirectModule {}
