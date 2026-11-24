import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminDashboardStats {
  restaurants: {
    total: number;
    active: number;
    pending: number;
    growthPercentage: number;
  };
  branches: {
    total: number;
    active: number;
    availabilityRate: number;
  };
  catalog: {
    totalProducts: number;
    totalCategories: number;
  };
  users: {
    total: number;
    owners: number;
    superAdmins: number;
  };
  orders: {
    total: number;
    grossVolume: number;
    currency: string;
    growthPercentage: number;
  };
}

export interface VelocityDataPoint {
  date: string;
  orders: number;
  gmv: number;
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Scoped Aggregate Statistics across the fleet or specific brand/outlet
  async getDashboardStats(
    restaurantId?: string,
    branchId?: string,
    days = 30,
  ): Promise<AdminDashboardStats> {
    const isRestaurantScoped = restaurantId && restaurantId !== 'ALL';
    const isBranchScoped = branchId && branchId !== 'ALL';

    // Date range filter
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - (days || 30));

    // Restaurant counts
    const restWhere: any = { isDeleted: false };
    if (isRestaurantScoped) {
      restWhere.id = restaurantId;
    }

    // Branch counts
    const branchWhere: any = { isDeleted: false };
    if (isRestaurantScoped) {
      branchWhere.restaurantId = restaurantId;
    }
    if (isBranchScoped) {
      branchWhere.id = branchId;
    }

    // Catalog counts
    const prodWhere: any = { isDeleted: false };
    if (isRestaurantScoped) {
      prodWhere.restaurantId = restaurantId;
    }
    if (isBranchScoped) {
      prodWhere.branchProducts = { some: { branchId } };
    }

    const catWhere: any = { isDeleted: false };
    if (isRestaurantScoped) {
      catWhere.restaurantId = restaurantId;
    }

    // Orders & Sales counts
    const orderWhere: any = {
      createdAt: { gte: dateLimit },
    };
    if (isRestaurantScoped) {
      orderWhere.restaurantId = restaurantId;
    }
    if (isBranchScoped) {
      orderWhere.branchId = branchId;
    }

    const [
      totalRestaurants,
      activeRestaurants,
      totalBranches,
      activeBranches,
      totalProducts,
      totalCategories,
      totalUsers,
      totalOwners,
      totalSuperAdmins,
      orderAgg,
    ] = await Promise.all([
      this.prisma.restaurant.count({ where: restWhere }),
      this.prisma.restaurant.count({ where: { ...restWhere, isActive: true } }),
      this.prisma.branch.count({ where: branchWhere }),
      this.prisma.branch.count({ where: { ...branchWhere, isActive: true } }),
      this.prisma.product.count({ where: prodWhere }),
      this.prisma.category.count({ where: catWhere }),
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.user.count({ where: { isDeleted: false, role: 'ADMIN' } }),
      this.prisma.user.count({ where: { isDeleted: false, role: 'SUPER_ADMIN' } }),
      this.prisma.order.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        where: orderWhere,
      }),
    ]);

    const pendingRestaurants = Math.max(0, totalRestaurants - activeRestaurants);
    const availabilityRate = totalBranches > 0 ? Math.round((activeBranches / totalBranches) * 100) : 100;

    const realOrders = orderAgg._count.id || 0;
    const realGmv = Number(orderAgg._sum.totalAmount || 0);

    return {
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        pending: pendingRestaurants,
        growthPercentage: 0,
      },
      branches: {
        total: totalBranches,
        active: activeBranches,
        availabilityRate,
      },
      catalog: {
        totalProducts,
        totalCategories,
      },
      users: {
        total: totalUsers,
        owners: totalOwners,
        superAdmins: totalSuperAdmins,
      },
      orders: {
        total: realOrders,
        grossVolume: realGmv,
        currency: '₹',
        growthPercentage: 0,
      },
    };
  }

  // 2. Real Velocity Timeline with real daily order/GMV points
  async getDashboardVelocity(
    restaurantId?: string,
    branchId?: string,
    days = 30,
  ): Promise<VelocityDataPoint[]> {
    const isRestaurantScoped = restaurantId && restaurantId !== 'ALL';
    const isBranchScoped = branchId && branchId !== 'ALL';

    const numDays = Math.max(1, Math.min(days || 30, 90));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    const orderWhere: any = {
      createdAt: { gte: startDate },
    };
    if (isRestaurantScoped) {
      orderWhere.restaurantId = restaurantId;
    }
    if (isBranchScoped) {
      orderWhere.branchId = branchId;
    }

    // Fetch orders in period
    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dayMap = new Map<string, { orders: number; gmv: number }>();
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { orders: 0, gmv: 0 });
    }

    for (const ord of orders) {
      const key = ord.createdAt.toISOString().slice(0, 10);
      if (dayMap.has(key)) {
        const cur = dayMap.get(key)!;
        cur.orders += 1;
        cur.gmv += Number(ord.totalAmount || 0);
      }
    }

    const points: VelocityDataPoint[] = [];
    for (const [key, val] of dayMap.entries()) {
      const dateObj = new Date(key);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({
        date: dateStr,
        orders: val.orders,
        gmv: val.gmv,
      });
    }

    return points;
  }

  // 3. Recent Tenant Fleet Overview (scoped if restaurantId provided)
  async getRecentFleet(restaurantId?: string) {
    const isRestaurantScoped = restaurantId && restaurantId !== 'ALL';

    const where: any = { isDeleted: false };
    if (isRestaurantScoped) {
      where.id = restaurantId;
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
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

    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      owner: r.owner,
      branchesCount: r._count.branches,
      productsCount: r._count.products,
      currency: r.defaultCurrency,
      status: r.isActive ? 'ACTIVE' : 'PENDING_REVIEW',
      createdAt: r.createdAt,
    }));
  }
}
