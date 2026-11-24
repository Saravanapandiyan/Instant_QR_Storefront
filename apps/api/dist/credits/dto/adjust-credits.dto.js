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
exports.AdjustCreditsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AdjustCreditsDto {
    restaurantId;
    delta;
    reason;
    notes;
}
exports.AdjustCreditsDto = AdjustCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc',
        description: 'The restaurant ID to adjust credits for',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdjustCreditsDto.prototype, "restaurantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 500,
        description: 'Credit adjustment delta (+ to grant, - to deduct)',
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdjustCreditsDto.prototype, "delta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ADMIN_ADJUSTMENT',
        description: 'Reason for the credit adjustment',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdjustCreditsDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Granted for promotional partnership pilot',
        description: 'Optional note or reference ticket',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdjustCreditsDto.prototype, "notes", void 0);
//# sourceMappingURL=adjust-credits.dto.js.map