import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** GET /analytics/:slug?from=YYYY-MM-DD&to=YYYY-MM-DD — chỉ chủ link. */
  @Get(':slug')
  getBySlug(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analytics.getBySlug(user.id, slug, query);
  }
}
