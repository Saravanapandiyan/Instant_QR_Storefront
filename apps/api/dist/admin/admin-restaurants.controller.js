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
exports.AdminRestaurantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/guards/super-admin.guard");
const admin_restaurants_service_1 = require("./admin-restaurants.service");
let AdminRestaurantsController = class AdminRestaurantsController {
    restaurantsService;
    constructor(restaurantsService) {
        this.restaurantsService = restaurantsService;
    }
    getRestaurants(query) {
        return this.restaurantsService.getRestaurants(query);
    }
    getRestaurantById(id) {
        return this.restaurantsService.getRestaurantById(id);
    }
    updateRestaurantStatus(id, body) {
        return this.restaurantsService.updateRestaurantStatus(id, body.isActive);
    }
};
exports.AdminRestaurantsController = AdminRestaurantsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all restaurant tenants with status filters and search' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Filtered list of restaurants with counts.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_restaurants_service_1.AdminRestaurantsQuery]),
    __metadata("design:returntype", void 0)
], AdminRestaurantsController.prototype, "getRestaurants", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full profile of a restaurant for deep inspection' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Full tenant details with branches and catalog counts.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Restaurant not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminRestaurantsController.prototype, "getRestaurantById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend or reactivate a restaurant tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated operational status.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminRestaurantsController.prototype, "updateRestaurantStatus", null);
exports.AdminRestaurantsController = AdminRestaurantsController = __decorate([
    (0, swagger_1.ApiTags)('admin-restaurants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('admin/restaurants'),
    __metadata("design:paramtypes", [admin_restaurants_service_1.AdminRestaurantsService])
], AdminRestaurantsController);
//# sourceMappingURL=admin-restaurants.controller.js.map