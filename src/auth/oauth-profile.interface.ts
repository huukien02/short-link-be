export type OAuthProvider = 'google' | 'facebook';

/** Thông tin chuẩn hóa từ các provider OAuth (Google, Facebook). */
export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}
