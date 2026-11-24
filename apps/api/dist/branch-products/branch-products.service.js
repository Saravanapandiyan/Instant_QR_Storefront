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
exports.BranchProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchProductsService = class BranchProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRestaurantMatrix(restaurantId, ownerId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                branches: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'asc' },
                },
                categories: {
                    where: { isDeleted: false },
                    orderBy: { sortOrder: 'asc' },
                },
                products: {
                    where: { isDeleted: false },
                    include: {
                        category: true,
                        branchProducts: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!restaurant || restaurant.isDeleted) {
            throw new common_1.NotFoundException('Restaurant concept not found');
        }
        if (restaurant.ownerId !== ownerId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId, userId: ownerId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.menu?.view) {
                throw new common_1.ForbiddenException('You do not have permission to view this restaurant menu');
            }
        }
        return restaurant;
    }
    async toggleAvailability(branchId, productId, ownerId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
            include: { restaurant: true },
        });
        if (!branch || branch.isDeleted) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (branch.restaurant.ownerId !== ownerId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.menu?.toggleStock) {
                throw new common_1.ForbiddenException('You do not have permission to change stock in this branch');
            }
        }
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product || product.isDeleted || product.restaurantId !== branch.restaurantId) {
            throw new common_1.NotFoundException('Product not found in this restaurant catalog');
        }
        const existing = await this.prisma.branchProduct.findUnique({
            where: {
                branchId_productId: {
                    branchId,
                    productId,
                },
            },
        });
        if (existing) {
            return this.prisma.branchProduct.update({
                where: { id: existing.id },
                data: { isAvailable: !existing.isAvailable },
            });
        }
        return this.prisma.branchProduct.create({
            data: {
                branchId,
                productId,
                isAvailable: false,
                isEnabled: true,
            },
        });
    }
    async updateOverride(branchId, productId, dto, ownerId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
            include: { restaurant: true },
        });
        if (!branch || branch.isDeleted) {
            throw new common_1.NotFoundException('Branch not found');
        }
        if (branch.restaurant.ownerId !== ownerId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.menu?.toggleStock) {
                throw new common_1.ForbiddenException('You do not have permission to change stock in this branch');
            }
        }
        return this.prisma.branchProduct.upsert({
            where: {
                branchId_productId: {
                    branchId,
                    productId,
                },
            },
            update: {
                ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
                ...(dto.priceOverride !== undefined ? { priceOverride: dto.priceOverride } : {}),
                ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
            },
            create: {
                branchId,
                productId,
                isAvailable: dto.isAvailable ?? true,
                priceOverride: dto.priceOverride,
                isEnabled: dto.isEnabled ?? true,
            },
        });
    }
    async getBranchMenu(branchId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
            include: {
                restaurant: true,
                branchProducts: true,
            },
        });
        if (!branch || branch.isDeleted) {
            throw new common_1.NotFoundException('Branch not found');
        }
        const categories = await this.prisma.category.findMany({
            where: {
                restaurantId: branch.restaurantId,
                isActive: true,
                isDeleted: false,
            },
            orderBy: { sortOrder: 'asc' },
        });
        const products = await this.prisma.product.findMany({
            where: {
                restaurantId: branch.restaurantId,
                isDeleted: false,
            },
            include: {
                category: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const branchProductMap = new Map(branch.branchProducts.map((bp) => [bp.productId, bp]));
        const branchCurrency = branch.currency || 'INR';
        const brandCurrency = branch.restaurant.defaultCurrency || 'INR';
        const isCrossCurrency = branchCurrency !== brandCurrency;
        const items = products
            .map((p) => {
            const override = branchProductMap.get(p.id);
            const isEnabled = override ? override.isEnabled : true;
            const isAvailable = override ? override.isAvailable : true;
            const hasOverride = override?.priceOverride !== null &&
                override?.priceOverride !== undefined;
            const requiresLocalPrice = isCrossCurrency && !hasOverride;
            const finalPrice = hasOverride
                ? override.priceOverride
                : isCrossCurrency
                    ? null
                    : p.basePrice;
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                translations: p.translations,
                basePrice: p.basePrice,
                finalPrice,
                priceOverride: override?.priceOverride ?? null,
                requiresLocalPrice,
                imageUrl: p.imageUrl,
                categoryId: p.categoryId,
                categoryName: p.category.name,
                categoryTranslations: p.category.translations,
                isAvailable,
                isEnabled,
            };
        })
            .filter((p) => p.isEnabled);
        return {
            branch: {
                id: branch.id,
                name: branch.name,
                slug: branch.slug,
                address: branch.address,
                phone: branch.phone,
                countryCode: branch.countryCode,
                currency: branchCurrency,
            },
            restaurant: {
                id: branch.restaurant.id,
                name: branch.restaurant.name,
                slug: branch.restaurant.slug,
                description: branch.restaurant.description,
                logoUrl: branch.restaurant.logoUrl,
                defaultCurrency: brandCurrency,
                themeConfig: branch.restaurant.themeConfig,
                paymentConfig: branch.restaurant.paymentConfig,
            },
            isCrossCurrency,
            categories,
            items,
        };
    }
};
exports.BranchProductsService = BranchProductsService;
exports.BranchProductsService = BranchProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchProductsService);
//# sourceMappingURL=branch-products.service.js.map