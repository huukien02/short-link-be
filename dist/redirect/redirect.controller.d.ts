import type { Request, Response } from 'express';
import { LinksService } from '../links/links.service';
import { RedirectService } from './redirect.service';
declare class UnlockDto {
    password: string;
}
export declare class RedirectController {
    private readonly links;
    private readonly redirect;
    constructor(links: LinksService, redirect: RedirectService);
    go(slug: string, req: Request, res: Response): Promise<void>;
    unlock(slug: string, dto: UnlockDto, req: Request): Promise<{
        targetUrl: string;
    }>;
    private assertUsable;
    private afterHit;
}
export {};
