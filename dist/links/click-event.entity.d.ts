import { Link } from './link.entity';
export declare class ClickEvent {
    id: string;
    link: Link;
    linkId: string;
    country: string | null;
    device: string | null;
    browser: string | null;
    referrer: string | null;
    createdAt: Date;
}
