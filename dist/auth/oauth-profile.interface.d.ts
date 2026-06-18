export type OAuthProvider = 'google' | 'facebook';
export interface OAuthProfile {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    name?: string;
    avatar?: string;
}
