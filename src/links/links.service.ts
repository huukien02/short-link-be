import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import type { Redis } from 'ioredis';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { REDIS_CLIENT } from '../redis/redis.module';
import { encodeBase62 } from './base62.util';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksDto } from './dto/list-links.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link } from './link.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class LinksService implements OnModuleInit {
  private readonly logger = new Logger(LinksService.name);

  /** TTL cache slug (giây). Ngắn để giới hạn lệch clickCount/maxClicks. */
  private readonly SLUG_TTL = 60;
  /** TTL cache âm (slug không tồn tại) — chống dò slug rác. */
  private readonly NEG_TTL = 10;

  constructor(
    @InjectRepository(Link)
    private readonly linksRepo: Repository<Link>,
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  private slugKey(slug: string): string {
    return `link:${slug}`;
  }

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

    const saved = await this.linksRepo.save(link);
    await this.invalidateSlug(saved.slug); // tránh phục vụ bản cũ từ cache
    return saved;
  }

  async remove(ownerId: string, id: string) {
    const link = await this.findOneOwned(ownerId, id);
    const slug = link.slug; // lấy trước khi remove
    await this.linksRepo.remove(link);
    await this.invalidateSlug(slug);
    return { id };
  }

  /**
   * Dùng cho redirect (đường nóng) — tra theo slug với cache-aside qua Redis.
   * Redis chỉ là lớp tăng tốc: mọi lỗi Redis đều nuốt và fallback về DB,
   * KHÔNG để Redis down làm sập redirect.
   */
  async findBySlug(slug: string): Promise<Link | null> {
    const key = this.slugKey(slug);

    // 1) Thử cache
    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        if (cached === '') return null; // cache âm: slug không tồn tại
        return this.deserialize(cached);
      }
    } catch (err) {
      this.logger.warn(`Redis GET lỗi, fallback DB: ${err}`);
    }

    // 2) Miss → DB
    const link = await this.linksRepo.findOne({ where: { slug } });

    // 3) Ghi lại cache (best-effort, không chặn nếu Redis lỗi)
    try {
      if (!link) {
        await this.redis.set(key, '', 'EX', this.NEG_TTL);
      } else {
        await this.redis.set(key, this.serialize(link), 'EX', this.SLUG_TTL);
      }
    } catch (err) {
      this.logger.warn(`Redis SET lỗi (bỏ qua): ${err}`);
    }

    return link;
  }

  /** Xoá cache slug — gọi khi link thay đổi (sửa/xóa/tắt). */
  async invalidateSlug(slug: string): Promise<void> {
    await this.invalidateSlugs([slug]);
  }

  /** Xoá cache nhiều slug trong 1 lệnh DEL — dùng cho cron dọn link hết hạn. */
  async invalidateSlugs(slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;
    try {
      await this.redis.del(...slugs.map((s) => this.slugKey(s)));
    } catch (err) {
      this.logger.warn(`Redis DEL lỗi (bỏ qua): ${err}`);
    }
  }

  /** Chỉ cache các field redirect cần — bỏ qua quan hệ owner/events. */
  private serialize(link: Link): string {
    return JSON.stringify({
      id: link.id,
      slug: link.slug,
      targetUrl: link.targetUrl,
      passwordHash: link.passwordHash,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      maxClicks: link.maxClicks,
      clickCount: link.clickCount,
      isActive: link.isActive,
    });
  }

  /** Dựng lại entity-shape từ cache (giữ expiresAt là Date — controller gọi .getTime()). */
  private deserialize(raw: string): Link {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return this.linksRepo.create({
      ...o,
      expiresAt: o.expiresAt ? new Date(o.expiresAt as string) : null,
    });
  }

  /**
   * Đánh dấu inactive các link đã hết hạn (quá `expiresAt` hoặc chạm `maxClicks`).
   * Chạy theo lịch (xem LinksCleanupService). Trả về số link bị tắt.
   * Dùng UPDATE thẳng (set-based), không load entity — rẻ và atomic.
   * `RETURNING slug` để biết link nào vừa tắt → xoá cache, tránh redirect bản cũ tới hết TTL.
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
      .returning(['slug'])
      .execute();

    const slugs = (result.raw as Array<{ slug: string }>).map((r) => r.slug);
    await this.invalidateSlugs(slugs);

    return result.affected ?? slugs.length;
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
