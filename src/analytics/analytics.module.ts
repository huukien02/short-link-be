import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClickEvent } from '../links/click-event.entity';
import { Link } from '../links/link.entity';
import { AnalyticsRollupService } from './analytics-rollup.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DailyStat } from './daily-stat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyStat, Link, ClickEvent])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRollupService],
})
export class AnalyticsModule {}
