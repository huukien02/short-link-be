import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { OAuthProfile } from './oauth-profile.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Đăng nhập/đăng ký qua OAuth (Google/Facebook): upsert user rồi phát token. */
  async oauthLogin(profile: OAuthProfile) {
    if (!profile.email) {
      throw new UnauthorizedException(
        `Tài khoản ${profile.provider} không chia sẻ email`,
      );
    }
    const user = await this.users.upsertOAuthUser(profile);
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'change-me-too'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new UnauthorizedException('Refresh token không hợp lệ');

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.users.setRefreshTokenHash(userId, null);
    return { success: true };
  }

  private async issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET', 'change-me'),
      expiresIn: this.config.get<string>(
        'JWT_ACCESS_TTL',
        '15m',
      ) as JwtSignOptions['expiresIn'],
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'change-me-too'),
      expiresIn: this.config.get<string>(
        'JWT_REFRESH_TTL',
        '7d',
      ) as JwtSignOptions['expiresIn'],
    });

    // Lưu hash refresh token để có thể revoke
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshTokenHash(user.id, refreshTokenHash);

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }
}
