import { Repository } from 'typeorm';
import { ClickEvent } from '../links/click-event.entity';
export interface ClickContext {
    referrer?: string | null;
    userAgent?: string | null;
}
export declare class RedirectService {
    private readonly eventsRepo;
    private readonly logger;
    constructor(eventsRepo: Repository<ClickEvent>);
    recordClick(linkId: string, ctx: ClickContext): void;
}
