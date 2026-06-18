import { OnModuleInit } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link } from './link.entity';
export declare class LinksService implements OnModuleInit {
    private readonly linksRepo;
    private readonly dataSource;
    constructor(linksRepo: Repository<Link>, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    create(ownerId: string, dto: CreateLinkDto): Promise<Link>;
    findAllByOwner(ownerId: string, query: ListLinksDto): Promise<{
        items: Link[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOneOwned(ownerId: string, id: string): Promise<Link>;
    update(ownerId: string, id: string, dto: UpdateLinkDto): Promise<Link>;
    remove(ownerId: string, id: string): Promise<{
        id: string;
    }>;
    findBySlug(slug: string): Promise<Link | null>;
    incrementClick(id: string): Promise<import("typeorm").UpdateResult>;
    private generateSlug;
}
