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
exports.AdminDishesService = exports.UpdateAdminDishDto = exports.CreateAdminDishDto = exports.AdminDishesQuery = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
class AdminDishesQuery {
    restaurantId;
    branchId;
    categoryId;
    search;
}
exports.AdminDishesQuery = AdminDishesQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminDishesQuery.prototype, "restaurantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminDishesQuery.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminDishesQuery.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminDishesQuery.prototype, "search", void 0);
class CreateAdminDishDto {
    restaurantId;
    categoryId;
    name;
    description;
    basePrice;
    imageUrl;
}
exports.CreateAdminDishDto = CreateAdminDishDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminDishDto.prototype, "restaurantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminDishDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminDishDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminDishDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAdminDishDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminDishDto.prototype, "imageUrl", void 0);
class UpdateAdminDishDto {
    name;
    description;
    basePrice;
    imageUrl;
    categoryId;
}
exports.UpdateAdminDishDto = UpdateAdminDishDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDishDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDishDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateAdminDishDto.prototype, "basePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDishDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminDishDto.prototype, "categoryId", void 0);
let AdminDishesService = class AdminDishesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDishes(query) {
        const { restaurantId, branchId, categoryId, search } = query;
        const where = { isDeleted: false };
        if (restaurantId && restaurantId !== 'ALL') {
            where.restaurantId = restaurantId;
        }
        if (categoryId && categoryId !== 'ALL') {
            where.categoryId = categoryId;
        }
        if (search && search.trim().length > 0) {
            const q = search.trim().toLowerCase();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { restaurant: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [totalCount, dishes] = await Promise.all([
            this.prisma.product.count({ where: { isDeleted: false } }),
            this.prisma.product.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            defaultCurrency: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    branchProducts: {
                        select: {
                            id: true,
                            branchId: true,
                            isAvailable: true,
                            priceOverride: true,
                        },
                    },
                },
            }),
        ]);
        const formatted = dishes.map((p) => {
            let inStock = true;
            if (branchId && branchId !== 'ALL') {
                const bp = p.branchProducts.find((item) => item.branchId === branchId);
                if (bp)
                    inStock = bp.isAvailable;
            }
            else if (p.branchProducts.length > 0) {
                inStock = p.branchProducts.some((item) => item.isAvailable);
            }
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                basePrice: Number(p.basePrice),
                imageUrl: p.imageUrl,
                restaurantId: p.restaurantId,
                restaurant: p.restaurant,
                categoryId: p.categoryId,
                category: p.category,
                inStock,
                branchProductsCount: p.branchProducts.length,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            };
        });
        return {
            total: totalCount,
            filteredCount: formatted.length,
            dishes: formatted,
        };
    }
    async getDishById(id) {
        const dish = await this.prisma.product.findFirst({
            where: { id, isDeleted: false },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        defaultCurrency: true,
                    },
                },
                category: true,
                branchProducts: {
                    include: {
                        branch: {
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
        if (!dish) {
            throw new common_1.NotFoundException(`Dish with ID ${id} not found.`);
        }
        return {
            ...dish,
            basePrice: Number(dish.basePrice),
        };
    }
    async createDish(dto) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
            include: { branches: { where: { isDeleted: false } } },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException(`Restaurant ${dto.restaurantId} not found.`);
        }
        const dish = await this.prisma.product.create({
            data: {
                restaurantId: dto.restaurantId,
                categoryId: dto.categoryId,
                name: dto.name.trim(),
                description: dto.description?.trim() || null,
                basePrice: dto.basePrice,
                imageUrl: dto.imageUrl?.trim() || null,
            },
        });
        if (restaurant.branches.length > 0) {
            await this.prisma.branchProduct.createMany({
                data: restaurant.branches.map((b) => ({
                    branchId: b.id,
                    productId: dish.id,
                    isAvailable: true,
                })),
                skipDuplicates: true,
            });
        }
        return this.getDishById(dish.id);
    }
    async updateDish(id, dto) {
        const dish = await this.prisma.product.findFirst({
            where: { id, isDeleted: false },
        });
        if (!dish) {
            throw new common_1.NotFoundException(`Dish ${id} not found.`);
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.description !== undefined)
            data.description = dto.description.trim();
        if (dto.basePrice !== undefined)
            data.basePrice = dto.basePrice;
        if (dto.imageUrl !== undefined)
            data.imageUrl = dto.imageUrl.trim() || null;
        if (dto.categoryId !== undefined)
            data.categoryId = dto.categoryId;
        await this.prisma.product.update({
            where: { id },
            data,
        });
        return this.getDishById(id);
    }
    async toggleStock(id, inStock, branchId) {
        const dish = await this.prisma.product.findFirst({
            where: { id, isDeleted: false },
        });
        if (!dish) {
            throw new common_1.NotFoundException(`Dish ${id} not found.`);
        }
        if (branchId && branchId !== 'ALL') {
            await this.prisma.branchProduct.upsert({
                where: { branchId_productId: { branchId, productId: id } },
                create: {
                    branchId,
                    productId: id,
                    isAvailable: inStock,
                },
                update: {
                    isAvailable: inStock,
                },
            });
        }
        else {
            await this.prisma.branchProduct.updateMany({
                where: { productId: id },
                data: { isAvailable: inStock },
            });
        }
        return {
            success: true,
            dishId: id,
            inStock,
            message: inStock ? 'Dish marked in stock' : 'Dish marked sold out',
        };
    }
    async deleteDish(id, adminUserId) {
        const dish = await this.prisma.product.findFirst({
            where: { id, isDeleted: false },
        });
        if (!dish) {
            throw new common_1.NotFoundException(`Dish ${id} not found.`);
        }
        await this.prisma.product.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: adminUserId,
            },
        });
        return {
            success: true,
            message: `Dish "${dish.name}" archived successfully.`,
        };
    }
};
exports.AdminDishesService = AdminDishesService;
exports.AdminDishesService = AdminDishesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDishesService);
//# sourceMappingURL=admin-dishes.service.js.map