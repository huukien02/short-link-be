import {
  Body,
  Controller,
  Get,
  GoneException,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { IsString } from 'class-validator';
import { LinksService } from '../links/links.service';
import { Link } from '../links/link.entity';
import { RedirectService } from './redirect.service';

class UnlockDto {
  @IsString()
  password: string;
}

@Controller('r')
export class RedirectController {
  constructor(
    private readonly links: LinksService,
    private readonly redirect: RedirectService,
  ) {}

  @Get(':slug')
  async go(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const link = await this.links.findBySlug(slug);
    this.assertUsable(link);

    if (link!.passwordHash) {
      // Link cần mật khẩu → client phải gọi POST /r/:slug/unlock
      throw new UnauthorizedException('Link này yêu cầu mật khẩu');
    }

    this.afterHit(link!, req);
    return res.redirect(302, link!.targetUrl);
  }

  @Post(':slug/unlock')
  async unlock(
    @Param('slug') slug: string,
    @Body() dto: UnlockDto,
    @Req() req: Request,
  ) {
    const link = await this.links.findBySlug(slug);
    this.assertUsable(link);

    if (!link!.passwordHash) {
      return { targetUrl: link!.targetUrl };
    }

    const ok = await bcrypt.compare(dto.password, link!.passwordHash);
    if (!ok) throw new UnauthorizedException('Sai mật khẩu');

    this.afterHit(link!, req);
    return { targetUrl: link!.targetUrl };
  }

  /** Kiểm tra link còn dùng được không (tồn tại / active / hạn / max click). */
  private assertUsable(link: Link | null): void {
    if (!link || !link.isActive) {
      throw new NotFoundException('Link không tồn tại');
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Link đã hết hạn');
    }
    if (link.maxClicks != null && link.clickCount >= link.maxClicks) {
      throw new GoneException('Link đã đạt giới hạn lượt click');
    }
  }

  /** Đếm click + ghi event async (không chặn redirect). */
  private afterHit(link: Link, req: Request): void {
    void this.links.incrementClick(link.id);
    this.redirect.recordClick(link.id, {
      referrer: req.headers['referer'] ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
