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
exports.AdminSettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const admin_settings_service_1 = require("./admin-settings.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/guards/super-admin.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AdminSettingsController = class AdminSettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    getPublicBranding() {
        return this.settingsService.getPublicBranding();
    }
    getBranding() {
        return this.settingsService.getBranding();
    }
    updateBranding(dto, user) {
        return this.settingsService.updateBranding(dto, user?.id || 'admin');
    }
    uploadLogo(file) {
        return this.settingsService.uploadLogo(file);
    }
    getStripeConfig() {
        return this.settingsService.getStripeConfig();
    }
    updateStripeConfig(dto, user) {
        return this.settingsService.updateStripeConfig(dto, user?.id || 'admin');
    }
    testStripeConnection() {
        return this.settingsService.testStripeConnection();
    }
};
exports.AdminSettingsController = AdminSettingsController;
__decorate([
    (0, common_1.Get)('platform/branding'),
    (0, swagger_1.ApiOperation)({ summary: 'Public: Get global platform branding, title, logos, and footer settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "getPublicBranding", null);
__decorate([
    (0, common_1.Get)('admin/settings/branding'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Get full branding and footer configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "getBranding", null);
__decorate([
    (0, common_1.Patch)('admin/settings/branding'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Update site title, logos, and footer attribution' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "updateBranding", null);
__decorate([
    (0, common_1.Post)('admin/settings/upload-logo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Upload branding logo or favicon image' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)('admin/settings/stripe'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Get Stripe gateway keys (masked) and mode' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "getStripeConfig", null);
__decorate([
    (0, common_1.Patch)('admin/settings/stripe'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Update Stripe publishable/secret keys and mode' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "updateStripeConfig", null);
__decorate([
    (0, common_1.Post)('admin/settings/stripe/test-connection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Verify Stripe API connection using configured secret key' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "testStripeConnection", null);
exports.AdminSettingsController = AdminSettingsController = __decorate([
    (0, swagger_1.ApiTags)('admin-settings'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [admin_settings_service_1.AdminSettingsService])
], AdminSettingsController);
//# sourceMappingURL=admin-settings.controller.js.map