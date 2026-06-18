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
exports.CreateLinkDto = void 0;
const class_validator_1 = require("class-validator");
class CreateLinkDto {
    targetUrl;
    customSlug;
    expiresAt;
    maxClicks;
    password;
}
exports.CreateLinkDto = CreateLinkDto;
__decorate([
    (0, class_validator_1.IsUrl)({ require_protocol: true }, { message: 'targetUrl phải là URL hợp lệ' }),
    __metadata("design:type", String)
], CreateLinkDto.prototype, "targetUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_-]{3,32}$/, {
        message: 'customSlug chỉ gồm chữ, số, _ , - (3–32 ký tự)',
    }),
    __metadata("design:type", String)
], CreateLinkDto.prototype, "customSlug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)({}, { message: 'expiresAt phải là ngày ISO8601' }),
    __metadata("design:type", String)
], CreateLinkDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateLinkDto.prototype, "maxClicks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreateLinkDto.prototype, "password", void 0);
//# sourceMappingURL=create-link.dto.js.map