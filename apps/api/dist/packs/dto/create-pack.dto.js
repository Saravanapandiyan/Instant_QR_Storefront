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
exports.CreatePackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePackDto {
    code;
    name;
    ordersCount;
    bonusCredits;
    price;
    priceUsd;
    priceInr;
    regionalPricingJson;
    featuresJson;
    isActive;
    sortOrder;
}
exports.CreatePackDto = CreatePackDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PRO',
        description: 'Unique code identifier for the pack (e.g. STARTER, PRO, BUSINESS)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePackDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Pro Pack (Popular)',
        description: 'Display name of the pack',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePackDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 3000,
        description: 'Base order credits included in the pack',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePackDto.prototype, "ordersCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 300,
        description: 'Bonus order credits rewarded with the pack',
        default: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePackDto.prototype, "bonusCredits", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 499.0,
        description: 'Single plan price in platform currency',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePackDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 20.0,
        description: 'Price in USD',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePackDto.prototype, "priceUsd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 699.0,
        description: 'Price in INR',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePackDto.prototype, "priceInr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: { PHP: 1150, MYR: 95 },
        description: 'Optional regional pricing mapping in JSON format',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePackDto.prototype, "regionalPricingJson", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            qrMenu: true,
            aiMenuImport: true,
            dailyReports: true,
            kitchenScreen: true,
        },
        description: 'Feature flag permissions unlocked with this pack',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePackDto.prototype, "featuresJson", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: true,
        description: 'Whether the pack is active and visible for purchase',
        default: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreatePackDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 4,
        description: 'Display sequence order (lower numbers appear first)',
        default: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePackDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-pack.dto.js.map