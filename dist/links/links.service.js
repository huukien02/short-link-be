"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const typeorm_2 = require("typeorm");
const base62_util_1 = require("./base62.util");
const link_entity_1 = require("./link.entity");
const PG_UNIQUE_VIOLATION = '23505';
let LinksService = class LinksService {
    linksRepo;
    dataSource;
    constructor(linksRepo, dataSource) {
        this.linksRepo = linksRepo;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        await this.dataSource.query(`CREATE SEQUENCE IF NOT EXISTS "link_slug_seq" START 1000`);
    }
    async create(ownerId, dto) {
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
        }
        catch (err) {
            if (err instanceof typeorm_2.QueryFailedError &&
                err.code === PG_UNIQUE_VIOLATION) {
                throw new common_1.ConflictException(`Slug "${slug}" đã tồn tại`);
            }
            throw err;
        }
    }
    async findAllByOwner(ownerId, query) {
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
    async findOneOwned(ownerId, id) {
        const link = await this.linksRepo.findOne({ where: { id, ownerId } });
        if (!link)
            throw new common_1.NotFoundException('Không tìm thấy link');
        return link;
    }
    async update(ownerId, id, dto) {
        const link = await this.findOneOwned(ownerId, id);
        if (dto.targetUrl !== undefined)
            link.targetUrl = dto.targetUrl;
        if (dto.expiresAt !== undefined) {
            link.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        }
        if (dto.maxClicks !== undefined)
            link.maxClicks = dto.maxClicks;
        if (dto.isActive !== undefined)
            link.isActive = dto.isActive;
        if (dto.password !== undefined) {
            link.passwordHash = dto.password
                ? await bcrypt.hash(dto.password, 10)
                : null;
        }
        return this.linksRepo.save(link);
    }
    async remove(ownerId, id) {
        const link = await this.findOneOwned(ownerId, id);
        await this.linksRepo.remove(link);
        return { id };
    }
    findBySlug(slug) {
        return this.linksRepo.findOne({ where: { slug } });
    }
    incrementClick(id) {
        return this.linksRepo.increment({ id }, 'clickCount', 1);
    }
    async generateSlug() {
        const rows = await this.dataSource.query(`SELECT nextval('link_slug_seq') AS seq`);
        return (0, base62_util_1.encodeBase62)(Number(rows[0].seq));
    }
};
exports.LinksService = LinksService;
exports.LinksService = LinksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(link_entity_1.Link)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], LinksService);
//# sourceMappingURL=links.service.js.map