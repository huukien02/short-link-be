"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    users;
    jwt;
    config;
    constructor(users, jwt, config) {
        this.users = users;
        this.jwt = jwt;
        this.config = config;
    }
    async oauthLogin(profile) {
        if (!profile.email) {
            throw new common_1.UnauthorizedException(`Tài khoản ${profile.provider} không chia sẻ email`);
        }
        const user = await this.users.upsertOAuthUser(profile);
        return this.issueTokens(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET', 'change-me-too'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token không hợp lệ');
        }
        const user = await this.users.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Refresh token không hợp lệ');
        }
        const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!matches)
            throw new common_1.UnauthorizedException('Refresh token không hợp lệ');
        return this.issueTokens(user);
    }
    async logout(userId) {
        await this.users.setRefreshTokenHash(userId, null);
        return { success: true };
    }
    async issueTokens(user) {
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwt.signAsync(payload, {
            secret: this.config.get('JWT_SECRET', 'change-me'),
            expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
        });
        const refreshToken = await this.jwt.signAsync(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET', 'change-me-too'),
            expiresIn: this.config.get('JWT_REFRESH_TTL', '7d'),
        });
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.users.setRefreshTokenHash(user.id, refreshTokenHash);
        return {
            user: { id: user.id, email: user.email },
            accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map