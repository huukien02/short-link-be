import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class UpdateLinkDto {
  @IsOptional()
  @IsUrl({ require_protocol: true })
  targetUrl?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxClicks?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Đặt password mới; gửi chuỗi rỗng "" để gỡ password
  @IsOptional()
  @IsString()
  password?: string;
}
