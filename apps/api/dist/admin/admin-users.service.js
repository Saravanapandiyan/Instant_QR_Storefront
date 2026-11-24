"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersService = exports.UpdateUserStatusDto = exports.UpdateUserRoleDto = exports.UpdateAdminUserDto = exports.CreateAdminUserDto = exports.AdminUsersQuery = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
class AdminUsersQuery {
    search;
    role;
    status;
    restaurantId;
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
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminUsersQuery.prototype, "restaurantId", void 0);
class CreateAdminUserDto {
    name;
    email;
    password;
    countryCode;
    phone;
    role;
    restaurantId;
    pinCode;
}
exports.CreateAdminUserDto = CreateAdminUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "restaurantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "pinCode", void 0);
class UpdateAdminUserDto {
    name;
    email;
    countryCode;
    phone;
    role;
    password;
    pinCode;
}
exports.UpdateAdminUserDto = UpdateAdminUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Role),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "pinCode", void 0);
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
        const { search, role, status = 'ALL', restaurantId } = query;
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
        if (restaurantId && restaurantId !== 'ALL') {
            where.OR = [
                { restaurants: { some: { id: restaurantId, isDeleted: false } } },
                { staffProfiles: { some: { restaurantId, isActive: true } } },
            ];
        }
        if (search && search.trim().length > 0) {
            const q = search.trim().toLowerCase();
            const searchCondition = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
            ];
            if (where.OR) {
                where.AND = [{ OR: where.OR }, { OR: searchCondition }];
                delete where.OR;
            }
            else {
                where.OR = searchCondition;
            }
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
                    staffProfiles: {
                        select: {
                            id: true,
                            role: true,
                            pinCode: true,
                            isActive: true,
                            restaurant: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
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
            staffProfiles: u.staffProfiles,
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
                staffProfiles: {
                    select: {
                        id: true,
                        role: true,
                        pinCode: true,
                        isActive: true,
                        assignedBranches: true,
                        permissions: true,
                        restaurant: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
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
    async createUser(dto) {
        const email = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new common_1.ConflictException(`User with email "${email}" already exists.`);
        }
        const passwordHash = await bcrypt.hash(dto.password.trim(), 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email,
                passwordHash,
                countryCode: dto.countryCode || '+91',
                phone: dto.phone?.trim() || null,
                role: dto.role,
                isPlatformAdmin: dto.role === client_1.Role.SUPER_ADMIN,
            },
        });
        if (dto.restaurantId && (dto.role === client_1.Role.STAFF || dto.role === client_1.Role.MANAGER)) {
            await this.prisma.staffMember.create({
                data: {
                    restaurantId: dto.restaurantId,
                    userId: user.id,
                    role: dto.role === client_1.Role.MANAGER ? 'MANAGER' : 'CASHIER',
                    pinCode: dto.pinCode?.trim() || '1234',
                    assignedBranches: ['ALL'],
                    permissions: {
                        canCreateOrders: true,
                        canSettleOrders: true,
                        canAccessKds: true,
                    },
                },
            });
        }
        return this.getUserById(user.id);
    }
    async updateUser(id, dto, currentAdminId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.email !== undefined) {
            const email = dto.email.trim().toLowerCase();
            if (email !== user.email) {
                const emailTaken = await this.prisma.user.findUnique({ where: { email } });
                if (emailTaken)
                    throw new common_1.ConflictException(`Email "${email}" is already registered.`);
                data.email = email;
            }
        }
        if (dto.countryCode !== undefined)
            data.countryCode = dto.countryCode;
        if (dto.phone !== undefined)
            data.phone = dto.phone.trim();
        if (dto.role !== undefined) {
            data.role = dto.role;
            data.isPlatformAdmin = dto.role === client_1.Role.SUPER_ADMIN;
        }
        if (dto.password && dto.password.trim().length > 0) {
            data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
        }
        await this.prisma.user.update({
            where: { id },
            data,
        });
        if (dto.pinCode && dto.pinCode.trim().length > 0) {
            await this.prisma.staffMember.updateMany({
                where: { userId: id },
                data: { pinCode: dto.pinCode.trim() },
            });
        }
        return this.getUserById(id);
    }
    async deleteUser(id, currentAdminId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        }
        if (id === currentAdminId) {
            throw new common_1.ForbiddenException('Super Administrators cannot delete their own active account.');
        }
        if (user.role === client_1.Role.SUPER_ADMIN) {
            const remainingSuperAdmins = await this.prisma.user.count({
                where: { role: client_1.Role.SUPER_ADMIN, isDeleted: false, id: { not: id } },
            });
            if (remainingSuperAdmins < 1) {
                throw new common_1.ForbiddenException('Cannot delete the last remaining active Super Admin.');
            }
        }
        await this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: currentAdminId,
            },
        });
        return {
            success: true,
            message: `User "${user.name}" has been successfully removed.`,
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