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
exports.AdminBranchesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../auth/guards/super-admin.guard");
const admin_branches_service_1 = require("./admin-branches.service");
let AdminBranchesController = class AdminBranchesController {
    branchesService;
    constructor(branchesService) {
        this.branchesService = branchesService;
    }
    getBranches(query) {
        return this.branchesService.getBranches(query);
    }
    getBranchById(id) {
        return this.branchesService.getBranchById(id);
    }
    createBranch(body) {
        return this.branchesService.createBranch(body);
    }
    updateBranch(id, body) {
        return this.branchesService.updateBranch(id, body);
    }
    deleteBranch(id, req) {
        return this.branchesService.deleteBranch(id, req.user?.id);
    }
    getTables(branchId) {
        return this.branchesService.getTables(branchId);
    }
    createTable(branchId, body) {
        return this.branchesService.createTable(branchId, body);
    }
    deleteTable(tableId) {
        return this.branchesService.deleteTable(tableId);
    }
};
exports.AdminBranchesController = AdminBranchesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all physical branch outlets with scoping and status filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Filtered list of outlets with counts.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_branches_service_1.AdminBranchesQuery]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full branch details with table manifests' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "getBranchById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Provision a new branch outlet' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_branches_service_1.CreateAdminBranchDto]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Update branch information' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_branches_service_1.UpdateAdminBranchDto]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin: Archive branch outlet' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "deleteBranch", null);
__decorate([
    (0, common_1.Get)(':id/tables'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tables for a branch' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "getTables", null);
__decorate([
    (0, common_1.Post)(':id/tables'),
    (0, swagger_1.ApiOperation)({ summary: 'Create table standee in a branch' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_branches_service_1.CreateAdminTableDto]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "createTable", null);
__decorate([
    (0, common_1.Delete)(':id/tables/:tableId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete table standee' }),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminBranchesController.prototype, "deleteTable", null);
exports.AdminBranchesController = AdminBranchesController = __decorate([
    (0, swagger_1.ApiTags)('admin-branches'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('admin/branches'),
    __metadata("design:paramtypes", [admin_branches_service_1.AdminBranchesService])
], AdminBranchesController);
//# sourceMappingURL=admin-branches.controller.js.map