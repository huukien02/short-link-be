import { Link } from '../links/link.entity';
export declare class User {
    id: string;
    email: string;
    googleId: string | null;
    facebookId: string | null;
    name: string | null;
    avatar: string | null;
    refreshTokenHash: string | null;
    links: Link[];
    createdAt: Date;
}
