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
exports.CreditsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const credits_service_1 = require("./credits.service");
const purchase_pack_dto_1 = require("./dto/purchase-pack.dto");
const adjust_credits_dto_1 = require("./dto/adjust-credits.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/guards/super-admin.guard");
let CreditsController = class CreditsController {
    creditsService;
    constructor(creditsService) {
        this.creditsService = creditsService;
    }
    getBalance(restaurantId, req) {
        return this.creditsService.getBalance(restaurantId, req.user.id);
    }
    getLedger(restaurantId, limit, page, req) {
        return this.creditsService.getLedger(restaurantId, req.user.id, limit ? Number(limit) : 50, page ? Number(page) : 1);
    }
    createCheckout(dto, req) {
        const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
        return this.creditsService.createStripeCheckoutSession(dto, req.user.id, origin);
    }
    verifySession(dto, req) {
        return this.creditsService.verifyAndFulfillStripeSession(dto.sessionId, req.user.id);
    }
    purchasePack(dto, req) {
        const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
        return this.creditsService.purchasePack(dto, req.user.id, origin);
    }
    adjustCredits(dto, req) {
        return this.creditsService.adjustCredits(dto, req.user.id);
    }
};
exports.CreditsController = CreditsController;
__decorate([
    (0, common_1.Get)('balance/:restaurantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live credit balance and grace buffer metrics for restaurant' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CreditsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('ledger/:restaurantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get append-only transactional credit ledger history' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], CreditsController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Stripe Checkout Session for pack purchase' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CreditsController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Post)('verify-session'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify completed Stripe checkout session and credit restaurant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CreditsController.prototype, "verifySession", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase a credit pack with transactional top-up' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchase_pack_dto_1.PurchasePackDto, Object]),
    __metadata("design:returntype", void 0)
], CreditsController.prototype, "purchasePack", null);
__decorate([
    (0, common_1.Post)('adjust'),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Manually adjust restaurant credits' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [adjust_credits_dto_1.AdjustCreditsDto, Object]),
    __metadata("design:returntype", void 0)
], CreditsController.prototype, "adjustCredits", null);
exports.CreditsController = CreditsController = __decorate([
    (0, swagger_1.ApiTags)('credits'),
    (0, common_1.Controller)('credits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [credits_service_1.CreditsService])
], CreditsController);
//# sourceMappingURL=credits.controller.js.map