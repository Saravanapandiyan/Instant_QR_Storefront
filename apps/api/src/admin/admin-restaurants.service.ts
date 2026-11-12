import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class AdminRestaurantsQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'ALL' | 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED';
}

@Injectable()
export class AdminRestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get restaurants directory with search, status filtering and tab counts
  async getRestaurants(query: AdminRestaurantsQuery) {
    const { search, status = 'ALL' } = query;

    // Search condition
    const where: any = { isDeleted: false };

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { owner: { email: { contains: q, mode: 'insensitive' } } },
        { owner: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'SUSPENDED') {
      where.isActive = false;
    }

    const [allCount, activeCount, suspendedCount, restaurants] = await Promise.all([
      this.prisma.restaurant.count({ where: { isDeleted: false } }),
      this.prisma.restaurant.count({ where: { isDeleted: false, isActive: true } }),
      this.prisma.restaurant.count({ where: { isDeleted: false, isActive: false } }),
      this.prisma.restaurant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              countryCode: true,
            },
          },
          branches: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              address: true,
              phone: true,
            },
          },
          _count: {
            select: {
              branches: true,
              products: true,
              categories: true,
            },
          },
        },
      }),
    ]);

    const formatted = restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      logoUrl: r.logoUrl,
      defaultCurrency: r.defaultCurrency,
      isActive: r.isActive,
      status: r.isActive ? 'ACTIVE' : 'SUSPENDED',
      createdAt: r.createdAt,
      owner: r.owner,
      branchesCount: r._count.branches,
      productsCount: r._count.products,
      categoriesCount: r._count.categories,
      branches: r.branches,
    }));

    return {
      counts: {
        all: allCount,
        active: activeCount,
        pendingReview: 0,
        suspended: suspendedCount,
      },
      restaurants: formatted,
    };
  }

  // 2. Get single restaurant details for deep inspection
  async getRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id, isDeleted: false },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            createdAt: true,
          },
        },
        branches: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
        categories: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            sortOrder: true,
            isActive: true,
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: {
            branches: true,
            products: true,
            categories: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant tenant not found');
    }

    return {
      ...restaurant,
      status: restaurant.isActive ? 'ACTIVE' : 'SUSPENDED',
    };
  }

  // 3. Update restaurant operational status (Approve / Suspend / Reactivate)
  async updateRestaurantStatus(id: string, isActive: boolean) {
    const existing = await this.prisma.restaurant.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Restaurant tenant not found');
    }

    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { isActive },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            branches: true,
            products: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      isActive: updated.isActive,
      status: updated.isActive ? 'ACTIVE' : 'SUSPENDED',
      message: updated.isActive
        ? `Restaurant "${updated.name}" has been reactivated successfully.`
        : `Restaurant "${updated.name}" has been suspended. Storefront access is now frozen.`,
    };
  }
}
