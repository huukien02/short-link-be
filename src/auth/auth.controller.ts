import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './current-user.decorator';
import { FacebookAuthGuard } from './facebook-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { OAuthProfile } from './oauth-profile.interface';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.id);
  }

  // === Google OAuth ===

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth(): void {
    // Guard tự redirect sang trang đăng nhập Google
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  // === Facebook OAuth ===

  @UseGuards(FacebookAuthGuard)
  @Get('facebook')
  facebookAuth(): void {
    // Guard tự redirect sang trang đăng nhập Facebook
  }

  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  /** Dùng chung cho mọi provider: phát token → redirect về frontend. */
  private async handleOAuthCallback(req: Request, res: Response) {
    const profile = req.user as OAuthProfile;
    const tokens = await this.auth.oauthLogin(profile);

    const frontend = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    // Đưa token qua hash fragment (không gửi lên server → an toàn hơn query)
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return res.redirect(`${frontend}/auth/callback#${params.toString()}`);
  }
}
