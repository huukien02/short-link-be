import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthProfile } from '../auth/oauth-profile.interface';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  /** Tạo hoặc cập nhật user từ thông tin OAuth (Google/Facebook). */
  async upsertOAuthUser(profile: OAuthProfile) {
    const idField: 'googleId' | 'facebookId' =
      profile.provider === 'google' ? 'googleId' : 'facebookId';

    // Ưu tiên match theo provider id, sau đó theo email (liên kết tài khoản)
    let user =
      (await this.usersRepo.findOne({
        where: { [idField]: profile.providerId },
      })) ?? (await this.findByEmail(profile.email));

    if (!user) {
      user = this.usersRepo.create({
        email: profile.email,
        [idField]: profile.providerId,
        name: profile.name ?? null,
        avatar: profile.avatar ?? null,
      });
    } else {
      user[idField] = profile.providerId;
      user.name = profile.name ?? user.name;
      user.avatar = profile.avatar ?? user.avatar;
    }

    return this.usersRepo.save(user);
  }

  setRefreshTokenHash(id: string, hash: string | null) {
    return this.usersRepo.update({ id }, { refreshTokenHash: hash });
  }
}
