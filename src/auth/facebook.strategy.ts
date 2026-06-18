import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { OAuthProfile } from './oauth-profile.interface';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID') || 'changeme',
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET') || 'changeme',
      callbackURL:
        config.get<string>('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:3001/auth/facebook/callback',
      // Cần khai báo field để Facebook trả về email/tên/ảnh
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      scope: ['email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: unknown, user?: OAuthProfile) => void,
  ): void {
    const user: OAuthProfile = {
      provider: 'facebook',
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      name:
        profile.displayName ??
        [profile.name?.givenName, profile.name?.familyName]
          .filter(Boolean)
          .join(' '),
      avatar: profile.photos?.[0]?.value,
    };
    done(null, user);
  }
}
