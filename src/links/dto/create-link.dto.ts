import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLinkDto {
  @IsUrl({ require_protocol: true }, { message: 'targetUrl phải là URL hợp lệ' })
  targetUrl: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,32}$/, {
    message: 'customSlug chỉ gồm chữ, số, _ , - (3–32 ký tự)',
  })
  customSlug?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'expiresAt phải là ngày ISO8601' })
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxClicks?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;
}
