import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthUser } from './current-user.decorator';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    refresh(dto: RefreshDto): Promise<{
        user: {
            id: string;
            email: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    me(user: AuthUser): AuthUser;
    logout(user: AuthUser): Promise<{
        success: boolean;
    }>;
    googleAuth(): void;
    googleCallback(req: Request, res: Response): Promise<void>;
    facebookAuth(): void;
    facebookCallback(req: Request, res: Response): Promise<void>;
    private handleOAuthCallback;
}
