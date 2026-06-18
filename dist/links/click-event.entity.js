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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickEvent = void 0;
const typeorm_1 = require("typeorm");
const link_entity_1 = require("./link.entity");
let ClickEvent = class ClickEvent {
    id;
    link;
    linkId;
    country;
    device;
    browser;
    referrer;
    createdAt;
};
exports.ClickEvent = ClickEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClickEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => link_entity_1.Link, (link) => link.events, { onDelete: 'CASCADE' }),
    __metadata("design:type", link_entity_1.Link)
], ClickEvent.prototype, "link", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ClickEvent.prototype, "linkId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ClickEvent.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ClickEvent.prototype, "device", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ClickEvent.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ClickEvent.prototype, "referrer", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ClickEvent.prototype, "createdAt", void 0);
exports.ClickEvent = ClickEvent = __decorate([
    (0, typeorm_1.Entity)('click_events'),
    (0, typeorm_1.Index)(['linkId', 'createdAt'])
], ClickEvent);
//# sourceMappingURL=click-event.entity.js.map