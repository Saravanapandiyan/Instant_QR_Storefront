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
exports.AdminUsersService = exports.UpdateUserStatusDto = exports.UpdateUserRoleDto = exports.AdminUsersQuery = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
class AdminUsersQuery {
    search;
    role;
    status;
}
exports.AdminUsersQuery = AdminUsersQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminUsersQuery.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminUsersQuery.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminUsersQuery.prototype, "status", void 0);
class UpdateUserRoleDto {
    role;
}
exports.UpdateUserRoleDto = UpdateUserRoleDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], UpdateUserRoleDto.prototype, "role", void 0);
class UpdateUserStatusDto {
    isActive;
}
exports.UpdateUserStatusDto = UpdateUserStatusDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserStatusDto.prototype, "isActive", void 0);
let AdminUsersService = class AdminUsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsers(query) {
        const { search, role, status = 'ALL' } = query;
        const where = {};
        if (status === 'ACTIVE') {
            where.isDeleted = false;
        }
        else if (status === 'DEACTIVATED') {
            where.isDeleted = true;
        }
        if (role && role !== 'ALL') {
            if (['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'].includes(role.toUpperCase())) {
                where.role = role.toUpperCase();
            }
        }
        if (search && search.trim().length > 0) {
            const q = search.trim().toLowerCase();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [totalCount, ownersCount, staffCount, superAdminsCount, users] = await Promise.all([
            this.prisma.user.count({ where: { isDeleted: false } }),
            this.prisma.user.count({ where: { isDeleted: false, role: client_1.Role.ADMIN } }),
            this.prisma.user.count({
                where: {
                    isDeleted: false,
                    role: { in: [client_1.Role.MANAGER, client_1.Role.STAFF] },
                },
            }),
            this.prisma.user.count({ where: { isDeleted: false, role: client_1.Role.SUPER_ADMIN } }),
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    countryCode: true,
                    phone: true,
                    role: true,
                    isPlatformAdmin: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                    restaurants: {
                        where: { isDeleted: false },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isActive: true,
                        },
                    },
                },
            }),
        ]);
        const formattedUsers = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone ? `${u.countryCode || '+91'} ${u.phone}` : null,
            rawPhone: u.phone,
            countryCode: u.countryCode,
            role: u.role,
            isPlatformAdmin: u.isPlatformAdmin,
            isActive: !u.isDeleted,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            restaurants: u.restaurants,
        }));
        return {
            counts: {
                total: totalCount,
                owners: ownersCount,
                staff: staffCount,
                superAdmins: superAdminsCount,
            },
            users: formattedUsers,
        };
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                countryCode: true,
                phone: true,
                role: true,
                isPlatformAdmin: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
                restaurants: {
                    where: { isDeleted: false },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        branches: {
                            where: { isDeleted: false },
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        }
        return {
            ...user,
            isActive: !user.isDeleted,
            formattedPhone: user.phone ? `${user.countryCode || '+91'} ${user.phone}` : null,
        };
    }
    async updateUserRole(id, newRole, currentAdminId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        }
        if (!Object.values(client_1.Role).includes(newRole)) {
            throw new common_1.BadRequestException(`Invalid role: ${newRole}`);
        }
        if (user.role === client_1.Role.SUPER_ADMIN && newRole !== client_1.Role.SUPER_ADMIN) {
            const remainingSuperAdmins = await this.prisma.user.count({
                where: {
                    role: client_1.Role.SUPER_ADMIN,
                    isDeleted: false,
                    id: { not: id },
                },
            });
            if (remainingSuperAdmins < 1) {
                throw new common_1.ForbiddenException('Cannot demote the last remaining active Super Admin.');
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                role: newRole,
                isPlatformAdmin: newRole === client_1.Role.SUPER_ADMIN,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isPlatformAdmin: true,
                isDeleted: true,
                updatedAt: true,
            },
        });
        return {
            message: `User role successfully updated to ${newRole}.`,
            user: updated,
        };
    }
    async updateUserStatus(id, isActive, currentAdminId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        }
        if (!isActive && id === currentAdminId) {
            throw new common_1.ForbiddenException('Super Administrators cannot deactivate their own active session.');
        }
        if (!isActive && user.role === client_1.Role.SUPER_ADMIN) {
            const remainingSuperAdmins = await this.prisma.user.count({
                where: {
                    role: client_1.Role.SUPER_ADMIN,
                    isDeleted: false,
                    id: { not: id },
                },
            });
            if (remainingSuperAdmins < 1) {
                throw new common_1.ForbiddenException('Cannot deactivate the last remaining active Super Admin.');
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: !isActive,
                deletedAt: isActive ? null : new Date(),
                deletedBy: isActive ? null : currentAdminId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDeleted: true,
                updatedAt: true,
            },
        });
        return {
            message: isActive ? 'Account reactivated successfully.' : 'Account disabled successfully.',
            user: {
                ...updated,
                isActive: !updated.isDeleted,
            },
        };
    }
};
exports.AdminUsersService = AdminUsersService;
exports.AdminUsersService = AdminUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUsersService);
//# sourceMappingURL=admin-users.service.js.map