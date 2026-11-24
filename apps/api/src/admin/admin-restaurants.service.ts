import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreditsService } from '../credits/credits.service';

export class AdminRestaurantsQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'ALL' | 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED';

  @IsOptional()
  @IsString()
  planTier?: 'ALL' | 'FREE' | 'PAID';
}

@Injectable()
export class AdminRestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly creditsService: CreditsService,
  ) {}

  // 1. Get restaurants directory with search, status filtering, free/paid classification and tab counts
  async getRestaurants(query: AdminRestaurantsQuery) {
    const { search, status = 'ALL', planTier = 'ALL' } = query;

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
              role: true,
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
          creditLedgers: {
            where: { reason: 'PACK_PURCHASE' },
            select: { id: true },
            take: 1,
          },
          _count: {
            select: {
              branches: true,
              products: true,
              categories: true,
              orders: true,
            },
          },
        },
      }),
    ]);

    let freeCount = 0;
    let paidCount = 0;

    const formattedAll = restaurants.map((r) => {
      const isPaid = (r.creditLedgers && r.creditLedgers.length > 0) || r.creditBalance > 100;
      const tier: 'FREE' | 'PAID' = isPaid ? 'PAID' : 'FREE';

      if (tier === 'PAID') {
        paidCount++;
      } else {
        freeCount++;
      }

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        logoUrl: r.logoUrl,
        defaultCurrency: r.defaultCurrency,
        creditBalance: r.creditBalance,
        planTier: tier,
        isActive: r.isActive,
        status: r.isActive ? 'ACTIVE' : 'SUSPENDED',
        createdAt: r.createdAt,
        owner: r.owner,
        branchesCount: r._count.branches,
        productsCount: r._count.products,
        categoriesCount: r._count.categories,
        ordersCount: r._count.orders,
        branches: r.branches,
      };
    });

    const filtered =
      planTier === 'ALL'
        ? formattedAll
        : formattedAll.filter((r) => r.planTier === planTier);

    return {
      counts: {
        all: allCount,
        active: activeCount,
        pendingReview: 0,
        suspended: suspendedCount,
        free: freeCount,
        paid: paidCount,
      },
      restaurants: filtered,
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

  // 4. Super Admin: Adjust Restaurant Order Credits (+/-)
  async adjustRestaurantCredits(
    restaurantId: string,
    delta: number,
    reason: string,
    notes: string | undefined,
    adminUserId: string,
  ) {
    return this.creditsService.adjustCredits(
      {
        restaurantId,
        delta,
        reason: reason || 'ADMIN_ADJUSTMENT',
        notes,
      },
      adminUserId,
    );
  }

  // 5. Super Admin: Impersonate Restaurant Owner (1-Click Launch)
  async impersonateRestaurant(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }

    if (!restaurant.owner) {
      throw new NotFoundException(`Restaurant has no associated owner account`);
    }

    const token = this.authService.generateToken(
      restaurant.owner.id,
      restaurant.owner.email,
      restaurant.owner.role,
    );

    return {
      accessToken: token,
      user: restaurant.owner,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
    };
  }
}
