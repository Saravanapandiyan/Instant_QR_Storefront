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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async generateUniqueSlug(baseText) {
        const baseSlug = this.slugify(baseText) || 'branch';
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.branch.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async create(createDto, ownerId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: createDto.restaurantId },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException(`Restaurant with ID "${createDto.restaurantId}" not found`);
        }
        if (restaurant.ownerId !== ownerId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: createDto.restaurantId, userId: ownerId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.branches?.create) {
                throw new common_1.ForbiddenException('You do not have permission to add branches to this restaurant');
            }
        }
        let slug;
        if (createDto.slug) {
            slug = this.slugify(createDto.slug);
            const existing = await this.prisma.branch.findUnique({ where: { slug } });
            if (existing) {
                throw new common_1.ConflictException(`Branch with storefront slug "${slug}" already exists`);
            }
        }
        else {
            slug = await this.generateUniqueSlug(`${restaurant.slug}-${createDto.name}`);
        }
        const branch = await this.prisma.branch.create({
            data: {
                restaurantId: createDto.restaurantId,
                name: createDto.name,
                slug,
                address: createDto.address,
                phone: createDto.phone,
                countryCode: createDto.countryCode,
                currency: createDto.currency || restaurant.defaultCurrency || 'INR',
            },
            include: {
                restaurant: true,
            },
        });
        const existingProducts = await this.prisma.product.findMany({
            where: { restaurantId: createDto.restaurantId, isDeleted: false },
            select: { id: true },
        });
        if (existingProducts.length > 0) {
            await this.prisma.branchProduct.createMany({
                data: existingProducts.map((p) => ({
                    branchId: branch.id,
                    productId: p.id,
                    isAvailable: true,
                    isEnabled: true,
                })),
                skipDuplicates: true,
            });
        }
        return branch;
    }
    async findMine(userId) {
        const ownedBranches = await this.prisma.branch.findMany({
            where: {
                restaurant: {
                    ownerId: userId,
                    isDeleted: false,
                },
                isDeleted: false,
            },
            include: {
                restaurant: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const staffMemberships = await this.prisma.staffMember.findMany({
            where: { userId, isActive: true },
            include: {
                restaurant: {
                    include: {
                        branches: { where: { isDeleted: false }, include: { restaurant: true } },
                    },
                },
            },
        });
        const ownedIds = new Set(ownedBranches.map((b) => b.id));
        const staffBranches = [];
        for (const sm of staffMemberships) {
            if (sm.restaurant.isDeleted)
                continue;
            const assigned = Array.isArray(sm.assignedBranches)
                ? sm.assignedBranches
                : [];
            const isAll = assigned.includes('ALL') || assigned.length === 0;
            for (const b of sm.restaurant.branches) {
                if (!ownedIds.has(b.id)) {
                    if (isAll || assigned.includes(b.id)) {
                        staffBranches.push(b);
                        ownedIds.add(b.id);
                    }
                }
            }
        }
        return [...ownedBranches, ...staffBranches];
    }
    async findByRestaurant(restaurantId) {
        return this.prisma.branch.findMany({
            where: {
                restaurantId,
                isDeleted: false,
            },
            include: {
                restaurant: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findBySlug(slug) {
        let branch = await this.prisma.branch.findUnique({
            where: { slug },
            include: {
                restaurant: true,
            },
        });
        if (!branch || branch.isDeleted) {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { slug },
                include: {
                    branches: {
                        where: { isActive: true, isDeleted: false },
                        include: { restaurant: true },
                        take: 1,
                    },
                },
            });
            if (restaurant && restaurant.branches.length > 0) {
                branch = restaurant.branches[0];
            }
        }
        if (!branch || branch.isDeleted) {
            throw new common_1.NotFoundException(`Storefront "${slug}" not found`);
        }
        return branch;
    }
    async findOne(id) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                restaurant: true,
            },
        });
        if (!branch || branch.isDeleted) {
            throw new common_1.NotFoundException(`Branch with ID "${id}" not found`);
        }
        return branch;
    }
    async update(id, updateDto, ownerId) {
        const branch = await this.findOne(id);
        if (branch.restaurant.ownerId !== ownerId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.branches?.edit) {
                throw new common_1.ForbiddenException('You do not have permission to update this branch');
            }
        }
        const { restaurantId, ...restDto } = updateDto;
        const dataToUpdate = { ...restDto };
        if (updateDto.slug) {
            const slug = this.slugify(updateDto.slug);
            const existing = await this.prisma.branch.findUnique({ where: { slug } });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Storefront slug "${slug}" is already in use`);
            }
            dataToUpdate.slug = slug;
        }
        return this.prisma.branch.update({
            where: { id },
            data: dataToUpdate,
            include: { restaurant: true },
        });
    }
    async remove(id, ownerId) {
        const branch = await this.findOne(id);
        if (branch.restaurant.ownerId !== ownerId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.branches?.delete) {
                throw new common_1.ForbiddenException('You do not have permission to delete this branch');
            }
        }
        return this.prisma.branch.delete({
            where: { id },
        });
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map