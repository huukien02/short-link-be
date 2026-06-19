import { IsISO8601, IsOptional } from 'class-validator';

/** Khoảng thời gian xem analytics. Mặc định 30 ngày gần nhất nếu bỏ trống. */
export class AnalyticsQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsISO8601()
  to?: string; // 'YYYY-MM-DD'
}
