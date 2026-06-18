import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../auth/current-user.decorator';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinksService } from './links.service';
export declare class LinksController {
    private readonly links;
    private readonly config;
    constructor(links: LinksService, config: ConfigService);
    create(user: AuthUser, dto: CreateLinkDto): Promise<{
        shortUrl: string;
        id: string;
        slug: string;
        targetUrl: string;
        passwordHash: string | null;
        expiresAt: Date | null;
        maxClicks: number | null;
        clickCount: number;
        isActive: boolean;
        owner: import("../users/user.entity").User;
        ownerId: string;
        events: import("./click-event.entity").ClickEvent[];
        createdAt: Date;
    }>;
    list(user: AuthUser, query: ListLinksDto): Promise<{
        items: {
            shortUrl: string;
            id: string;
            slug: string;
            targetUrl: string;
            passwordHash: string | null;
            expiresAt: Date | null;
            maxClicks: number | null;
            clickCount: number;
            isActive: boolean;
            owner: import("../users/user.entity").User;
            ownerId: string;
            events: import("./click-event.entity").ClickEvent[];
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getOne(user: AuthUser, id: string): Promise<{
        shortUrl: string;
        id: string;
        slug: string;
        targetUrl: string;
        passwordHash: string | null;
        expiresAt: Date | null;
        maxClicks: number | null;
        clickCount: number;
        isActive: boolean;
        owner: import("../users/user.entity").User;
        ownerId: string;
        events: import("./click-event.entity").ClickEvent[];
        createdAt: Date;
    }>;
    update(user: AuthUser, id: string, dto: UpdateLinkDto): Promise<{
        shortUrl: string;
        id: string;
        slug: string;
        targetUrl: string;
        passwordHash: string | null;
        expiresAt: Date | null;
        maxClicks: number | null;
        clickCount: number;
        isActive: boolean;
        owner: import("../users/user.entity").User;
        ownerId: string;
        events: import("./click-event.entity").ClickEvent[];
        createdAt: Date;
    }>;
    remove(user: AuthUser, id: string): Promise<{
        id: string;
    }>;
    private withShortUrl;
}
