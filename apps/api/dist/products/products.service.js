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
exports.ProductsService = void 0;
require("multer");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../common/storage/storage.service");
let ProductsService = class ProductsService {
    prisma;
    storageService;
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    async create(createDto, file) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: createDto.restaurantId, isDeleted: false },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        const category = await this.prisma.category.findUnique({
            where: { id: createDto.categoryId, isDeleted: false },
        });
        if (!category || category.restaurantId !== createDto.restaurantId) {
            throw new common_1.BadRequestException('Category does not exist or does not belong to this restaurant');
        }
        let imageUrl = createDto.imageUrl;
        if (file) {
            imageUrl = await this.storageService.uploadFile(file, 'products');
        }
        const product = await this.prisma.product.create({
            data: {
                restaurantId: createDto.restaurantId,
                categoryId: createDto.categoryId,
                name: createDto.name,
                description: createDto.description,
                basePrice: createDto.basePrice,
                imageUrl,
            },
            include: {
                category: { select: { id: true, name: true } },
            },
        });
        const branches = await this.prisma.branch.findMany({
            where: { restaurantId: createDto.restaurantId, isDeleted: false },
            select: { id: true },
        });
        if (branches.length > 0) {
            await this.prisma.branchProduct.createMany({
                data: branches.map((b) => ({
                    branchId: b.id,
                    productId: product.id,
                    isAvailable: true,
                    isEnabled: true,
                })),
                skipDuplicates: true,
            });
        }
        return product;
    }
    async findAllByRestaurant(restaurantId, query = {}) {
        const { categoryId, search, page, limit } = query;
        const where = {
            restaurantId,
            isDeleted: false,
        };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (search && search.trim() !== '') {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (page && limit) {
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const skip = (pageNum - 1) * limitNum;
            const [items, total] = await Promise.all([
                this.prisma.product.findMany({
                    where,
                    skip,
                    take: limitNum,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        category: { select: { id: true, name: true } },
                        branchProducts: true,
                    },
                }),
                this.prisma.product.count({ where }),
            ]);
            return {
                data: items,
                meta: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            };
        }
        return this.prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                category: { select: { id: true, name: true } },
                branchProducts: true,
            },
        });
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id, isDeleted: false },
            include: {
                category: { select: { id: true, name: true } },
                branchProducts: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async update(id, updateDto, file) {
        const product = await this.findOne(id);
        if (updateDto.categoryId && updateDto.categoryId !== product.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: updateDto.categoryId, isDeleted: false },
            });
            if (!category || category.restaurantId !== product.restaurantId) {
                throw new common_1.BadRequestException('New category does not belong to this restaurant');
            }
        }
        let imageUrl = updateDto.imageUrl;
        if (file) {
            if (product.imageUrl) {
                await this.storageService.deleteFile(product.imageUrl);
            }
            imageUrl = await this.storageService.uploadFile(file, 'products');
        }
        return this.prisma.product.update({
            where: { id },
            data: {
                ...updateDto,
                ...(imageUrl !== undefined ? { imageUrl } : {}),
            },
            include: {
                category: { select: { id: true, name: true } },
                branchProducts: true,
            },
        });
    }
    async remove(id, userId) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], ProductsService);
//# sourceMappingURL=products.service.js.map