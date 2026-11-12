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
exports.AdminDashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/guards/super-admin.guard");
const admin_dashboard_service_1 = require("./admin-dashboard.service");
let AdminDashboardController = class AdminDashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getStats() {
        return this.dashboardService.getDashboardStats();
    }
    getVelocity() {
        return this.dashboardService.getDashboardVelocity();
    }
    getRecentFleet() {
        return this.dashboardService.getRecentFleet();
    }
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get aggregated platform statistics for Admin Dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Platform counts and growth metrics.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (Requires SUPER_ADMIN role)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('velocity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get 30-day order and GMV velocity telemetry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Timeline points for charting.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getVelocity", null);
__decorate([
    (0, common_1.Get)('recent-fleet'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recently onboarded restaurant tenants and fleet size' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of recent restaurant fleets.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getRecentFleet", null);
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, swagger_1.ApiTags)('admin-dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('admin/dashboard'),
    __metadata("design:paramtypes", [admin_dashboard_service_1.AdminDashboardService])
], AdminDashboardController);
//# sourceMappingURL=admin-dashboard.controller.js.map