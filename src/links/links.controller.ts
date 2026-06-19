import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as QRCode from 'qrcode';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link } from './link.entity';
import { LinksService } from './links.service';

@UseGuards(JwtAuthGuard)
@Controller('links')
export class LinksController {
  constructor(
    private readonly links: LinksService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateLinkDto) {
    const link = await this.links.create(user.id, dto);
    return this.withShortUrl(link);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: ListLinksDto) {
    const result = await this.links.findAllByOwner(user.id, query);
    return {
      ...result,
      items: result.items.map((l) => this.withShortUrl(l)),
    };
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const link = await this.links.findOneOwned(user.id, id);
    return this.withShortUrl(link);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    const link = await this.links.update(user.id, id, dto);
    return this.withShortUrl(link);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.links.remove(user.id, id);
  }

  /**
   * QR code động trỏ tới short URL. `?format=png` (mặc định) hoặc `?format=svg`.
   * Trả ảnh thô (dùng @Res() để bỏ qua interceptor bọc envelope).
   * Chỉ chủ link mới lấy được (findOneOwned verify ownership).
   */
  @Get(':id/qr')
  async qr(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('format') format = 'png',
  ) {
    const link = await this.links.findOneOwned(user.id, id);
    const target = this.shortUrl(link);

    if (format === 'svg') {
      const svg = await QRCode.toString(target, { type: 'svg', margin: 1 });
      res.type('image/svg+xml').send(svg);
      return;
    }
    if (format !== 'png') {
      throw new BadRequestException('format chỉ nhận "png" hoặc "svg"');
    }

    const buffer = await QRCode.toBuffer(target, {
      type: 'png',
      width: 512,
      margin: 1,
    });
    res.type('image/png').send(buffer);
  }

  /** Build short URL đầy đủ từ slug. */
  private shortUrl(link: Link): string {
    const base = this.config.get<string>(
      'SHORT_BASE_URL',
      'http://localhost:3001',
    );
    return `${base}/r/${link.slug}`;
  }

  /**
   * Chuẩn hóa link trả về frontend: gắn `shortUrl`, lộ `hasPassword`
   * và KHÔNG bao giờ rò `passwordHash` ra response.
   */
  private withShortUrl(link: Link) {
    const { passwordHash, ...rest } = link;
    return {
      ...rest,
      shortUrl: this.shortUrl(link),
      hasPassword: passwordHash != null,
    };
  }
}
