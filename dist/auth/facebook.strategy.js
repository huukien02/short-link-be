"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_facebook_1 = require("passport-facebook");
let FacebookStrategy = class FacebookStrategy extends (0, passport_1.PassportStrategy)(passport_facebook_1.Strategy, 'facebook') {
    constructor(config) {
        super({
            clientID: config.get('FACEBOOK_APP_ID') || 'changeme',
            clientSecret: config.get('FACEBOOK_APP_SECRET') || 'changeme',
            callbackURL: config.get('FACEBOOK_CALLBACK_URL') ||
                'http://localhost:3001/auth/facebook/callback',
            profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
            scope: ['email'],
        });
    }
    validate(_accessToken, _refreshToken, profile, done) {
        const user = {
            provider: 'facebook',
            providerId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName ??
                [profile.name?.givenName, profile.name?.familyName]
                    .filter(Boolean)
                    .join(' '),
            avatar: profile.photos?.[0]?.value,
        };
        done(null, user);
    }
};
exports.FacebookStrategy = FacebookStrategy;
exports.FacebookStrategy = FacebookStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FacebookStrategy);
//# sourceMappingURL=facebook.strategy.js.map