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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let StaffService = class StaffService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkRestaurantAuthority(restaurantId, rawUserId) {
        const userId = typeof rawUserId === 'object' && rawUserId !== null ? rawUserId.id : String(rawUserId);
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        if (restaurant.ownerId === userId) {
            return { isOwner: true, restaurant };
        }
        const staff = await this.prisma.staffMember.findUnique({
            where: {
                restaurantId_userId: {
                    restaurantId,
                    userId,
                },
            },
        });
        if (!staff || !staff.isActive) {
            throw new common_1.ForbiddenException('Access denied. You do not have permissions for this restaurant.');
        }
        const permissions = staff.permissions;
        if (!permissions?.staff?.view) {
            throw new common_1.ForbiddenException('Access denied. You do not have permission to view staff.');
        }
        return { isOwner: false, staff, restaurant };
    }
    async findByRestaurant(restaurantId, currentUserId) {
        await this.checkRestaurantAuthority(restaurantId, currentUserId);
        const staffMembers = await this.prisma.staffMember.findMany({
            where: { restaurantId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        countryCode: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return staffMembers;
    }
    async create(restaurantId, dto, currentUserId) {
        const authority = await this.checkRestaurantAuthority(restaurantId, currentUserId);
        if (!authority.isOwner) {
            const permissions = authority.staff?.permissions;
            if (!permissions?.staff?.manage) {
                throw new common_1.ForbiddenException('You do not have permission to create staff members.');
            }
        }
        const email = dto.email.toLowerCase().trim();
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const password = dto.password || 'Staff@1234';
            const passwordHash = await bcrypt.hash(password, 10);
            user = await this.prisma.user.create({
                data: {
                    email,
                    name: dto.name.trim(),
                    passwordHash,
                    phone: dto.phone?.trim() || null,
                    countryCode: dto.countryCode?.trim() || '+91',
                    role: 'STAFF',
                },
            });
        }
        else {
            const existing = await this.prisma.staffMember.findUnique({
                where: {
                    restaurantId_userId: {
                        restaurantId,
                        userId: user.id,
                    },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('This user is already a team member for this restaurant');
            }
            if (dto.name || dto.phone) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        ...(dto.name ? { name: dto.name.trim() } : {}),
                        ...(dto.phone ? { phone: dto.phone.trim() } : {}),
                        ...(dto.countryCode ? { countryCode: dto.countryCode.trim() } : {}),
                    },
                });
            }
        }
        const staffMember = await this.prisma.staffMember.create({
            data: {
                restaurantId,
                userId: user.id,
                role: dto.role,
                assignedBranches: dto.assignedBranches || ['ALL'],
                permissions: dto.permissions,
                pinCode: dto.pinCode?.trim() || null,
                isActive: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        countryCode: true,
                        role: true,
                    },
                },
            },
        });
        return staffMember;
    }
    async update(id, dto, currentUserId) {
        const staff = await this.prisma.staffMember.findUnique({
            where: { id },
            include: { restaurant: true },
        });
        if (!staff) {
            throw new common_1.NotFoundException('Staff member not found');
        }
        const authority = await this.checkRestaurantAuthority(staff.restaurantId, currentUserId);
        if (!authority.isOwner) {
            const permissions = authority.staff?.permissions;
            if (!permissions?.staff?.manage) {
                throw new common_1.ForbiddenException('You do not have permission to update staff members.');
            }
        }
        if (dto.name || dto.phone || dto.password) {
            const userUpdateData = {};
            if (dto.name)
                userUpdateData.name = dto.name.trim();
            if (dto.phone)
                userUpdateData.phone = dto.phone.trim();
            if (dto.countryCode)
                userUpdateData.countryCode = dto.countryCode.trim();
            if (dto.password) {
                userUpdateData.passwordHash = await bcrypt.hash(dto.password, 10);
            }
            await this.prisma.user.update({
                where: { id: staff.userId },
                data: userUpdateData,
            });
        }
        const updated = await this.prisma.staffMember.update({
            where: { id },
            data: {
                ...(dto.role ? { role: dto.role } : {}),
                ...(dto.assignedBranches ? { assignedBranches: dto.assignedBranches } : {}),
                ...(dto.permissions ? { permissions: dto.permissions } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                ...(dto.pinCode !== undefined ? { pinCode: dto.pinCode?.trim() || null } : {}),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        countryCode: true,
                        role: true,
                    },
                },
            },
        });
        return updated;
    }
    async toggleActive(id, currentUserId) {
        const staff = await this.prisma.staffMember.findUnique({
            where: { id },
        });
        if (!staff) {
            throw new common_1.NotFoundException('Staff member not found');
        }
        await this.checkRestaurantAuthority(staff.restaurantId, currentUserId);
        return this.prisma.staffMember.update({
            where: { id },
            data: { isActive: !staff.isActive },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        countryCode: true,
                        role: true,
                    },
                },
            },
        });
    }
    async remove(id, currentUserId) {
        const staff = await this.prisma.staffMember.findUnique({
            where: { id },
        });
        if (!staff) {
            throw new common_1.NotFoundException('Staff member not found');
        }
        const authority = await this.checkRestaurantAuthority(staff.restaurantId, currentUserId);
        if (!authority.isOwner) {
            const permissions = authority.staff?.permissions;
            if (!permissions?.staff?.manage) {
                throw new common_1.ForbiddenException('You do not have permission to delete staff members.');
            }
        }
        await this.prisma.staffMember.delete({
            where: { id },
        });
        return { message: 'Staff member removed successfully' };
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffService);
//# sourceMappingURL=staff.service.js.map