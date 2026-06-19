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
import { ConfigService } from '@nestjs/config';
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
    private readonly config: ConfigService,
  ) {}

  @Get(':slug')
  async go(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const link = await this.links.findBySlug(slug);

    // Đây là đường dẫn người dùng mở thẳng trên trình duyệt → KHÔNG ném JSON.
    // Link hỏng (không tồn tại / hết hạn / hết lượt) → đẩy sang trang báo đẹp ở FE.
    const reason = this.unusableReason(link);
    if (reason) {
      return res.redirect(302, `${this.frontendUrl()}/unavailable/${slug}?reason=${reason}`);
    }

    if (link!.passwordHash) {
      // Link cần mật khẩu → đẩy sang trang nhập pass ở frontend.
      // Trang đó sẽ gọi POST /r/:slug/unlock rồi tự điều hướng tới đích.
      return res.redirect(302, `${this.frontendUrl()}/unlock/${slug}`);
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

  /**
   * Lý do link không dùng được (cho đường dẫn trình duyệt GET):
   * 'notfound' | 'expired' | 'limit', hoặc null nếu còn tốt.
   */
  private unusableReason(
    link: Link | null,
  ): 'notfound' | 'expired' | 'limit' | null {
    if (!link || !link.isActive) return 'notfound';
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return 'expired';
    }
    if (link.maxClicks != null && link.clickCount >= link.maxClicks) {
      return 'limit';
    }
    return null;
  }

  /**
   * Kiểm tra link còn dùng được không — ném HTTP status chuẩn.
   * Dùng cho POST /unlock (client gọi bằng fetch nên nhận JSON là hợp lý).
   */
  private assertUsable(link: Link | null): void {
    const reason = this.unusableReason(link);
    if (reason === 'notfound') throw new NotFoundException('Link không tồn tại');
    if (reason === 'expired') throw new GoneException('Link đã hết hạn');
    if (reason === 'limit') {
      throw new GoneException('Link đã đạt giới hạn lượt click');
    }
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /** Đếm click + ghi event async (không chặn redirect). */
  private afterHit(link: Link, req: Request): void {
    void this.links.incrementClick(link.id);
    this.redirect.recordClick(link.id, {
      referrer: req.headers['referer'] ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });
  }
}
