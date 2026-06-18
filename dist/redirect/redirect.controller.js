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
exports.RedirectController = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const class_validator_1 = require("class-validator");
const links_service_1 = require("../links/links.service");
const redirect_service_1 = require("./redirect.service");
class UnlockDto {
    password;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnlockDto.prototype, "password", void 0);
let RedirectController = class RedirectController {
    links;
    redirect;
    constructor(links, redirect) {
        this.links = links;
        this.redirect = redirect;
    }
    async go(slug, req, res) {
        const link = await this.links.findBySlug(slug);
        this.assertUsable(link);
        if (link.passwordHash) {
            throw new common_1.UnauthorizedException('Link này yêu cầu mật khẩu');
        }
        this.afterHit(link, req);
        return res.redirect(302, link.targetUrl);
    }
    async unlock(slug, dto, req) {
        const link = await this.links.findBySlug(slug);
        this.assertUsable(link);
        if (!link.passwordHash) {
            return { targetUrl: link.targetUrl };
        }
        const ok = await bcrypt.compare(dto.password, link.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Sai mật khẩu');
        this.afterHit(link, req);
        return { targetUrl: link.targetUrl };
    }
    assertUsable(link) {
        if (!link || !link.isActive) {
            throw new common_1.NotFoundException('Link không tồn tại');
        }
        if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
            throw new common_1.GoneException('Link đã hết hạn');
        }
        if (link.maxClicks != null && link.clickCount >= link.maxClicks) {
            throw new common_1.GoneException('Link đã đạt giới hạn lượt click');
        }
    }
    afterHit(link, req) {
        void this.links.incrementClick(link.id);
        this.redirect.recordClick(link.id, {
            referrer: req.headers['referer'] ?? null,
            userAgent: req.headers['user-agent'] ?? null,
        });
    }
};
exports.RedirectController = RedirectController;
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RedirectController.prototype, "go", null);
__decorate([
    (0, common_1.Post)(':slug/unlock'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UnlockDto, Object]),
    __metadata("design:returntype", Promise)
], RedirectController.prototype, "unlock", null);
exports.RedirectController = RedirectController = __decorate([
    (0, common_1.Controller)('r'),
    __metadata("design:paramtypes", [links_service_1.LinksService,
        redirect_service_1.RedirectService])
], RedirectController);
//# sourceMappingURL=redirect.controller.js.map