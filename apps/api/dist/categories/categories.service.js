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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: createDto.restaurantId, isDeleted: false },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException('Restaurant branch not found');
        }
        let sortOrder = createDto.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
            const highestCategory = await this.prisma.category.findFirst({
                where: { restaurantId: createDto.restaurantId, isDeleted: false },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            sortOrder = highestCategory ? highestCategory.sortOrder + 1 : 0;
        }
        return this.prisma.category.create({
            data: {
                restaurantId: createDto.restaurantId,
                name: createDto.name,
                description: createDto.description,
                sortOrder,
            },
        });
    }
    async findAllByRestaurant(restaurantId) {
        return this.prisma.category.findMany({
            where: { restaurantId, isDeleted: false },
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { products: { where: { isDeleted: false } } },
                },
            },
        });
    }
    async findOne(id) {
        const category = await this.prisma.category.findUnique({
            where: { id, isDeleted: false },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async update(id, updateDto) {
        await this.findOne(id);
        return this.prisma.category.update({
            where: { id },
            data: updateDto,
        });
    }
    async remove(id, userId) {
        await this.findOne(id);
        return this.prisma.category.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map