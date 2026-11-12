import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    // 1. Create a category with auto-incrementing sortOrder
    async create(createDto: CreateCategoryDto) {
        // Check if the restaurant branch exists
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: createDto.restaurantId, isDeleted: false },
        });

        if (!restaurant) {
            throw new NotFoundException('Restaurant branch not found');
        }

        // Auto-calculate next sortOrder if not provided
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

    // 2. Get all non-deleted categories for a restaurant (ordered by sortOrder)
    async findAllByRestaurant(restaurantId: string) {
        return this.prisma.category.findMany({
            where: { restaurantId, isDeleted: false },
            orderBy: { sortOrder: 'asc' },
            include: {
                // We can also count how many active products are in this category
                _count: {
                    select: { products: { where: { isDeleted: false } } },
                },
            },
        });
    }

    // 3. Find one category by ID
    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id, isDeleted: false },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    // 4. Update category details (name, description, isActive, sortOrder)
    async update(id: string, updateDto: UpdateCategoryDto) {
        await this.findOne(id); // Ensures category exists and is not deleted

        return this.prisma.category.update({
            where: { id },
            data: updateDto,
        });
    }

    // 5. Soft-delete a category (records who deleted it and when)
    async remove(id: string, userId: string) {
        await this.findOne(id); // Ensures category exists

        return this.prisma.category.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId,
            },
        });
    }
}
