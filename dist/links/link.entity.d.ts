import { User } from '../users/user.entity';
import { ClickEvent } from './click-event.entity';
export declare class Link {
    id: string;
    slug: string;
    targetUrl: string;
    passwordHash: string | null;
    expiresAt: Date | null;
    maxClicks: number | null;
    clickCount: number;
    isActive: boolean;
    owner: User;
    ownerId: string;
    events: ClickEvent[];
    createdAt: Date;
}
