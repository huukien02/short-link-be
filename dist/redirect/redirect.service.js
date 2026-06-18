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
var RedirectService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const click_event_entity_1 = require("../links/click-event.entity");
let RedirectService = RedirectService_1 = class RedirectService {
    eventsRepo;
    logger = new common_1.Logger(RedirectService_1.name);
    constructor(eventsRepo) {
        this.eventsRepo = eventsRepo;
    }
    recordClick(linkId, ctx) {
        const event = this.eventsRepo.create({
            linkId,
            referrer: ctx.referrer ?? null,
            device: null,
            browser: null,
            country: null,
        });
        void this.eventsRepo.save(event).catch((err) => {
            this.logger.error(`Ghi click event thất bại: ${err}`);
        });
    }
};
exports.RedirectService = RedirectService;
exports.RedirectService = RedirectService = RedirectService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(click_event_entity_1.ClickEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RedirectService);
//# sourceMappingURL=redirect.service.js.map