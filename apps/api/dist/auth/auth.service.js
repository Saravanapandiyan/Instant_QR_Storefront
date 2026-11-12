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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                name: dto.name,
                countryCode: dto.countryCode,
                phone: dto.phone,
                role: 'ADMIN',
            },
        });
        const accessToken = this.generateToken(user.id, user.email, user.role);
        const { passwordHash: _, ...sanitizedUser } = user;
        return {
            user: sanitizedUser,
            accessToken,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: {
                staffProfiles: {
                    include: {
                        restaurant: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.role === 'STAFF' && user.staffProfiles.length > 0) {
            const hasActiveProfile = user.staffProfiles.some((sp) => sp.isActive);
            if (!hasActiveProfile) {
                throw new common_1.ForbiddenException('Your staff account has been deactivated. Please contact your restaurant administrator.');
            }
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const accessToken = this.generateToken(user.id, user.email, user.role);
        const { passwordHash: _, ...sanitizedUser } = user;
        return {
            user: sanitizedUser,
            accessToken,
        };
    }
    generateToken(userId, email, role) {
        const payload = { sub: userId, email, role };
        return this.jwtService.sign(payload);
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (dto.email && dto.email.toLowerCase() !== user.email) {
            const emailTaken = await this.prisma.user.findUnique({
                where: { email: dto.email.toLowerCase() },
            });
            if (emailTaken && emailTaken.id !== userId) {
                throw new common_1.ConflictException('This email is already in use by another account');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.name ? { name: dto.name.trim() } : {}),
                ...(dto.email ? { email: dto.email.toLowerCase().trim() } : {}),
                ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode?.trim() || null } : {}),
                ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
            },
        });
        const { passwordHash: _, ...sanitizedUser } = updatedUser;
        return sanitizedUser;
    }
    async changePassword(userId, currentPass, newPass) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Current password does not match');
        }
        const newPasswordHash = await bcrypt.hash(newPass, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });
        return { message: 'Password updated successfully' };
    }
    async getAdminStatus() {
        const count = await this.prisma.user.count({
            where: {
                role: 'SUPER_ADMIN',
                isDeleted: false,
            },
        });
        return {
            hasSuperAdmin: count > 0,
            totalSuperAdmins: count,
        };
    }
    async bootstrapSuperAdmin(dto) {
        const existingSuperAdminCount = await this.prisma.user.count({
            where: {
                role: 'SUPER_ADMIN',
                isDeleted: false,
            },
        });
        if (existingSuperAdminCount > 0) {
            const configuredSecret = process.env.ADMIN_SETUP_SECRET || 'instant-qr-admin-secret-2026';
            if (!dto.setupKey || dto.setupKey !== configuredSecret) {
                throw new common_1.ForbiddenException('Platform bootstrap is locked because a Super Admin account already exists. Provide a valid ADMIN_SETUP_SECRET key to create additional administrators.');
            }
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email address already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                name: dto.name.trim(),
                countryCode: dto.countryCode?.trim() || '+91',
                phone: dto.phone?.trim() || null,
                role: 'SUPER_ADMIN',
                isPlatformAdmin: true,
            },
        });
        const accessToken = this.generateToken(user.id, user.email, user.role);
        const { passwordHash: _, ...sanitizedUser } = user;
        return {
            user: sanitizedUser,
            accessToken,
        };
    }
    async adminLogin(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        if (!user || user.isDeleted) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.role !== 'SUPER_ADMIN' && !user.isPlatformAdmin) {
            throw new common_1.ForbiddenException('Access denied. This portal is strictly restricted to Platform Super Administrators.');
        }
        const accessToken = this.generateToken(user.id, user.email, user.role);
        const { passwordHash: _, ...sanitizedUser } = user;
        return {
            user: sanitizedUser,
            accessToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map