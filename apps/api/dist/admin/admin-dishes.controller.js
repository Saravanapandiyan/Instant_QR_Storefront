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
exports.AdminDishesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/guards/super-admin.guard");
const admin_dishes_service_1 = require("./admin-dishes.service");
let AdminDishesController = class AdminDishesController {
    dishesService;
    constructor(dishesService) {
        this.dishesService = dishesService;
    }
    getDishes(query) {
        return this.dishesService.getDishes(query);
    }
    getDishById(id) {
        return this.dishesService.getDishById(id);
    }
    createDish(body) {
        return this.dishesService.createDish(body);
    }
    updateDish(id, body) {
        return this.dishesService.updateDish(id, body);
    }
    toggleStock(id, body) {
        return this.dishesService.toggleStock(id, body.inStock, body.branchId);
    }
    deleteDish(id, req) {
        return this.dishesService.deleteDish(id, req.user?.id);
    }
};
exports.AdminDishesController = AdminDishesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all menu dishes with restaurant, branch and category filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Filtered list of master catalog dishes.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dishes_service_1.AdminDishesQuery]),
    __metadata("design:returntype", void 0)
], AdminDishesController.prototype, "getDishes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full dish detail' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminDishesController.prototype, "getDishById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Create a new dish in catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dishes_service_1.CreateAdminDishDto]),
    __metadata("design:returntype", void 0)
], AdminDishesController.prototype, "createDish", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Update dish details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dishes_service_1.UpdateAdminDishDto]),
    __metadata("design:returntype", void 0)
], AdminDishesController.prototype, "updateDish", null);
__decorate([
    (0, common_1.Patch)(':id/stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Toggle in-stock / sold-out state' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminDishesController.prototype, "toggleStock", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Archive dish from catalog' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminDishesController.prototype, "deleteDish", null);
exports.AdminDishesController = AdminDishesController = __decorate([
    (0, swagger_1.ApiTags)('admin-dishes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('admin/dishes'),
    __metadata("design:paramtypes", [admin_dishes_service_1.AdminDishesService])
], AdminDishesController);
//# sourceMappingURL=admin-dishes.controller.js.map