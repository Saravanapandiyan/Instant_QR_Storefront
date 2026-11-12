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
exports.RestaurantsService = void 0;
require("multer");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../common/storage/storage.service");
let RestaurantsService = class RestaurantsService {
    prisma;
    storageService;
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async generateUniqueSlug(name) {
        const baseSlug = this.slugify(name) || 'restaurant';
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.restaurant.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async create(createDto, ownerId, file) {
        let slug;
        if (createDto.slug) {
            slug = this.slugify(createDto.slug);
            const existing = await this.prisma.restaurant.findUnique({
                where: { slug },
            });
            if (existing) {
                throw new common_1.ConflictException(`Restaurant with slug "${slug}" already exists`);
            }
        }
        else {
            slug = await this.generateUniqueSlug(createDto.name);
        }
        let logoUrl = createDto.logoUrl;
        if (file) {
            logoUrl = await this.storageService.uploadFile(file, 'restaurants');
        }
        return this.prisma.restaurant.create({
            data: {
                name: createDto.name,
                slug,
                description: createDto.description,
                logoUrl,
                defaultCurrency: createDto.defaultCurrency || 'INR',
                ownerId,
            },
            include: {
                branches: true,
                _count: {
                    select: { branches: true, categories: true, products: true },
                },
            },
        });
    }
    async findMine(userId) {
        const ownedRestaurants = await this.prisma.restaurant.findMany({
            where: { ownerId: userId, isDeleted: false },
            include: {
                branches: {
                    where: { isDeleted: false },
                },
                _count: {
                    select: { branches: true, categories: true, products: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const staffMemberships = await this.prisma.staffMember.findMany({
            where: { userId, isActive: true },
            include: {
                restaurant: {
                    include: {
                        branches: { where: { isDeleted: false } },
                        _count: {
                            select: { branches: true, categories: true, products: true },
                        },
                    },
                },
            },
        });
        const ownedIds = new Set(ownedRestaurants.map((r) => r.id));
        const staffRestaurants = staffMemberships
            .filter((sm) => !ownedIds.has(sm.restaurant.id) && !sm.restaurant.isDeleted)
            .map((sm) => {
            const assigned = Array.isArray(sm.assignedBranches)
                ? sm.assignedBranches
                : [];
            const isAllBranches = assigned.includes('ALL') || assigned.length === 0;
            const filteredBranches = isAllBranches
                ? sm.restaurant.branches
                : sm.restaurant.branches.filter((b) => assigned.includes(b.id));
            return {
                ...sm.restaurant,
                branches: filteredBranches,
                _staffRole: sm.role,
                _staffPermissions: sm.permissions,
            };
        });
        return [...ownedRestaurants, ...staffRestaurants];
    }
    async findOne(id) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id },
            include: {
                branches: { where: { isDeleted: false } },
                categories: { where: { isDeleted: false } },
                _count: {
                    select: { branches: true, categories: true, products: true },
                },
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException(`Restaurant with ID "${id}" not found`);
        }
        return restaurant;
    }
    async update(id, updateDto, ownerId, file) {
        const restaurant = await this.findOne(id);
        const dataToUpdate = { ...updateDto };
        if (updateDto.slug) {
            const slug = this.slugify(updateDto.slug);
            const existing = await this.prisma.restaurant.findUnique({
                where: { slug },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Restaurant with slug "${slug}" is already in use`);
            }
            dataToUpdate.slug = slug;
        }
        if (file) {
            if (restaurant.logoUrl) {
                await this.storageService.deleteFile(restaurant.logoUrl);
            }
            dataToUpdate.logoUrl = await this.storageService.uploadFile(file, 'restaurants');
        }
        return this.prisma.restaurant.update({
            where: { id },
            data: dataToUpdate,
            include: {
                branches: true,
                _count: {
                    select: { branches: true, categories: true, products: true },
                },
            },
        });
    }
    async remove(id, ownerId) {
        await this.findOne(id);
        return this.prisma.restaurant.delete({
            where: { id },
        });
    }
};
exports.RestaurantsService = RestaurantsService;
exports.RestaurantsService = RestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], RestaurantsService);
//# sourceMappingURL=restaurants.service.js.map