import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class AdminDishesQuery {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateAdminDishDto {
  @IsString()
  restaurantId: string;

  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateAdminDishDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

@Injectable()
export class AdminDishesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get dishes directory with scope and category filtering
  async getDishes(query: AdminDishesQuery) {
    const { restaurantId, branchId, categoryId, search } = query;

    const where: any = { isDeleted: false };

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
      // If scoped to a branch, resolve branch-specific stock status
      let inStock = true;
      if (branchId && branchId !== 'ALL') {
        const bp = p.branchProducts.find((item) => item.branchId === branchId);
        if (bp) inStock = bp.isAvailable;
      } else if (p.branchProducts.length > 0) {
        // If multiple branches, considered in stock if at least one branch has it
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

  // 2. Get single dish details
  async getDishById(id: string) {
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
      throw new NotFoundException(`Dish with ID ${id} not found.`);
    }

    return {
      ...dish,
      basePrice: Number(dish.basePrice),
    };
  }

  // 3. Super Admin: Create a new dish
  async createDish(dto: CreateAdminDishDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
      include: { branches: { where: { isDeleted: false } } },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${dto.restaurantId} not found.`);
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

    // Auto-create branchProduct junction records for all active branches under this restaurant
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

  // 4. Super Admin: Update a dish
  async updateDish(id: string, dto: UpdateAdminDishDto) {
    const dish = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!dish) {
      throw new NotFoundException(`Dish ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.basePrice !== undefined) data.basePrice = dto.basePrice;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl.trim() || null;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;

    await this.prisma.product.update({
      where: { id },
      data,
    });

    return this.getDishById(id);
  }

  // 5. Super Admin: Toggle Stock Availability
  async toggleStock(id: string, inStock: boolean, branchId?: string) {
    const dish = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!dish) {
      throw new NotFoundException(`Dish ${id} not found.`);
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
    } else {
      // Toggle across all branches of the restaurant
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

  // 6. Super Admin: Soft-delete dish
  async deleteDish(id: string, adminUserId: string) {
    const dish = await this.prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!dish) {
      throw new NotFoundException(`Dish ${id} not found.`);
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
}
