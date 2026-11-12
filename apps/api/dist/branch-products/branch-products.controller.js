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
exports.BranchProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const branch_products_service_1 = require("./branch-products.service");
const update_branch_product_dto_1 = require("./dto/update-branch-product.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let BranchProductsController = class BranchProductsController {
    service;
    constructor(service) {
        this.service = service;
    }
    toggleAvailability(branchId, productId, user) {
        return this.service.toggleAvailability(branchId, productId, user.id);
    }
    updateOverride(branchId, productId, dto, user) {
        return this.service.updateOverride(branchId, productId, dto, user.id);
    }
    getRestaurantMatrix(restaurantId, user) {
        return this.service.getRestaurantMatrix(restaurantId, user.id);
    }
    getBranchMenu(branchId) {
        return this.service.getBranchMenu(branchId);
    }
};
exports.BranchProductsController = BranchProductsController;
__decorate([
    (0, common_1.Patch)(':branchId/:productId/toggle-availability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'One-click Toggle In-Stock / Sold Out for a specific branch' }),
    (0, swagger_1.ApiParam)({ name: 'branchId' }),
    (0, swagger_1.ApiParam)({ name: 'productId' }),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BranchProductsController.prototype, "toggleAvailability", null);
__decorate([
    (0, common_1.Patch)(':branchId/:productId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update branch stock, price override, or enablement' }),
    (0, swagger_1.ApiParam)({ name: 'branchId' }),
    (0, swagger_1.ApiParam)({ name: 'productId' }),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_branch_product_dto_1.UpdateBranchProductDto, Object]),
    __metadata("design:returntype", void 0)
], BranchProductsController.prototype, "updateOverride", null);
__decorate([
    (0, common_1.Get)('restaurant/:restaurantId/matrix'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get full branch product availability & pricing matrix for a restaurant concept' }),
    (0, swagger_1.ApiParam)({ name: 'restaurantId' }),
    __param(0, (0, common_1.Param)('restaurantId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BranchProductsController.prototype, "getRestaurantMatrix", null);
__decorate([
    (0, common_1.Get)('branch/:branchId/menu'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full branch menu for customer table QR storefront' }),
    (0, swagger_1.ApiParam)({ name: 'branchId' }),
    __param(0, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BranchProductsController.prototype, "getBranchMenu", null);
exports.BranchProductsController = BranchProductsController = __decorate([
    (0, swagger_1.ApiTags)('branch-products'),
    (0, common_1.Controller)('branch-products'),
    __metadata("design:paramtypes", [branch_products_service_1.BranchProductsService])
], BranchProductsController);
//# sourceMappingURL=branch-products.controller.js.map