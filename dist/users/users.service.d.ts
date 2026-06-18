import { Repository } from 'typeorm';
import { OAuthProfile } from '../auth/oauth-profile.interface';
import { User } from './user.entity';
export declare class UsersService {
    private readonly usersRepo;
    constructor(usersRepo: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    upsertOAuthUser(profile: OAuthProfile): Promise<User>;
    setRefreshTokenHash(id: string, hash: string | null): Promise<import("typeorm").UpdateResult>;
}
