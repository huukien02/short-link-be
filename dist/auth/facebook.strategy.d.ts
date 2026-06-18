import { ConfigService } from '@nestjs/config';
import { Profile, Strategy } from 'passport-facebook';
import { OAuthProfile } from './oauth-profile.interface';
declare const FacebookStrategy_base: new (...args: [options: import("passport-facebook").StrategyOptionsWithRequest] | [options: import("passport-facebook").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class FacebookStrategy extends FacebookStrategy_base {
    constructor(config: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: Profile, done: (err: unknown, user?: OAuthProfile) => void): void;
}
export {};
