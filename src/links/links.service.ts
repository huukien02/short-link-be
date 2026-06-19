import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { encodeBase62 } from './base62.util';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link } from './link.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class LinksService implements OnModuleInit {
  constructor(
    @InjectRepository(Link)
    private readonly linksRepo: Repository<Link>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Đảm bảo sequence sinh slug tồn tại — idempotent.
   * Cần thiết vì chế độ synchronize không tạo sequence (chỉ migration mới tạo).
   */
  async onModuleInit(): Promise<void> {
    await this.dataSource.query(
      `CREATE SEQUENCE IF NOT EXISTS "link_slug_seq" START 1000`,
    );
  }

  async create(ownerId: string, dto: CreateLinkDto) {
    const slug = dto.customSlug ?? (await this.generateSlug());

    const link = this.linksRepo.create({
      slug,
      targetUrl: dto.targetUrl,
      ownerId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      maxClicks: dto.maxClicks ?? null,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
    });

    try {
      return await this.linksRepo.save(link);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as unknown as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(`Slug "${slug}" đã tồn tại`);
      }
      throw err;
    }
  }

  async findAllByOwner(ownerId: string, query: ListLinksDto) {
    const { page, limit } = query;
    const [items, total] = await this.linksRepo.findAndCount({
      where: { ownerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneOwned(ownerId: string, id: string) {
    const link = await this.linksRepo.findOne({ where: { id, ownerId } });
    if (!link) throw new NotFoundException('Không tìm thấy link');
    return link;
  }

  async update(ownerId: string, id: string, dto: UpdateLinkDto) {
    const link = await this.findOneOwned(ownerId, id);

    if (dto.targetUrl !== undefined) link.targetUrl = dto.targetUrl;
    if (dto.expiresAt !== undefined) {
      link.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    if (dto.maxClicks !== undefined) link.maxClicks = dto.maxClicks;
    if (dto.isActive !== undefined) link.isActive = dto.isActive;
    if (dto.password !== undefined) {
      link.passwordHash = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : null;
    }

    return this.linksRepo.save(link);
  }

  async remove(ownerId: string, id: string) {
    const link = await this.findOneOwned(ownerId, id);
    await this.linksRepo.remove(link);
    return { id };
  }

  /** Dùng cho redirect — tra theo slug. */
  findBySlug(slug: string) {
    return this.linksRepo.findOne({ where: { slug } });
  }

  /**
   * Đánh dấu inactive các link đã hết hạn (quá `expiresAt` hoặc chạm `maxClicks`).
   * Chạy theo lịch (xem LinksCleanupService). Trả về số link bị tắt.
   * Dùng UPDATE thẳng (set-based), không load entity — rẻ và atomic.
   */
  async deactivateExpired(): Promise<number> {
    const result = await this.linksRepo
      .createQueryBuilder()
      .update(Link)
      .set({ isActive: false })
      .where('"isActive" = true')
      .andWhere(
        '(("expiresAt" IS NOT NULL AND "expiresAt" < now()) OR ' +
          '("maxClicks" IS NOT NULL AND "clickCount" >= "maxClicks"))',
      )
      .execute();
    return result.affected ?? 0;
  }

  /** Tăng click count atomic (không load entity). */
  incrementClick(id: string) {
    return this.linksRepo.increment({ id }, 'clickCount', 1);
  }

  /** Sinh slug Base62 từ Postgres sequence — không trùng, không cần check DB. */
  private async generateSlug(): Promise<string> {
    const rows: Array<{ seq: string }> = await this.dataSource.query(
      `SELECT nextval('link_slug_seq') AS seq`,
    );
    return encodeBase62(Number(rows[0].seq));
  }
}
