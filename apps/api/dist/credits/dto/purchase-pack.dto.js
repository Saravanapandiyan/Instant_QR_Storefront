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
exports.PurchasePackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PurchasePackDto {
    restaurantId;
    packId;
    paymentMethod;
    idempotencyKey;
}
exports.PurchasePackDto = PurchasePackDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc',
        description: 'The restaurant ID to top up credits for',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PurchasePackDto.prototype, "restaurantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'c8a1b2d3-e4f5-6789-0abc-def123456789',
        description: 'The pack ID being purchased',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PurchasePackDto.prototype, "packId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'STRIPE',
        description: 'Payment method utilized (STRIPE, RAZORPAY, MOCK_CARD)',
        enum: ['STRIPE', 'RAZORPAY', 'MOCK_CARD'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PurchasePackDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'idemp_txn_17950000_abc123',
        description: 'Optional client idempotency key to prevent double charging',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PurchasePackDto.prototype, "idempotencyKey", void 0);
//# sourceMappingURL=purchase-pack.dto.js.map