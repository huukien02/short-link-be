"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinksController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_link_dto_1 = require("./dto/create-link.dto");
const list_links_dto_1 = require("./dto/list-links.dto");
const update_link_dto_1 = require("./dto/update-link.dto");
const links_service_1 = require("./links.service");
let LinksController = class LinksController {
    links;
    config;
    constructor(links, config) {
        this.links = links;
        this.config = config;
    }
    async create(user, dto) {
        const link = await this.links.create(user.id, dto);
        return this.withShortUrl(link);
    }
    async list(user, query) {
        const result = await this.links.findAllByOwner(user.id, query);
        return {
            ...result,
            items: result.items.map((l) => this.withShortUrl(l)),
        };
    }
    async getOne(user, id) {
        const link = await this.links.findOneOwned(user.id, id);
        return this.withShortUrl(link);
    }
    async update(user, id, dto) {
        const link = await this.links.update(user.id, id, dto);
        return this.withShortUrl(link);
    }
    remove(user, id) {
        return this.links.remove(user.id, id);
    }
    withShortUrl(link) {
        const base = this.config.get('SHORT_BASE_URL', 'http://localhost:3001');
        return { ...link, shortUrl: `${base}/r/${link.slug}` };
    }
};
exports.LinksController = LinksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_link_dto_1.CreateLinkDto]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_links_dto_1.ListLinksDto]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_link_dto_1.UpdateLinkDto]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LinksController.prototype, "remove", null);
exports.LinksController = LinksController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('links'),
    __metadata("design:paramtypes", [links_service_1.LinksService,
        config_1.ConfigService])
], LinksController);
//# sourceMappingURL=links.controller.js.map