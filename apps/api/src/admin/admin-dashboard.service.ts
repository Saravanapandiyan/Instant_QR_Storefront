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

  // 1. Live Aggregate Statistics across the entire SaaS fleet
  async getDashboardStats(): Promise<AdminDashboardStats> {
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
    ] = await Promise.all([
      this.prisma.restaurant.count({ where: { isDeleted: false } }),
      this.prisma.restaurant.count({ where: { isDeleted: false, isActive: true } }),
      this.prisma.branch.count({ where: { isDeleted: false } }),
      this.prisma.branch.count({ where: { isDeleted: false, isActive: true } }),
      this.prisma.product.count({ where: { isDeleted: false } }),
      this.prisma.category.count({ where: { isDeleted: false } }),
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.user.count({ where: { isDeleted: false, role: 'ADMIN' } }),
      this.prisma.user.count({ where: { isDeleted: false, role: 'SUPER_ADMIN' } }),
    ]);

    const pendingRestaurants = Math.max(0, totalRestaurants - activeRestaurants);
    const availabilityRate = totalBranches > 0 ? Math.round((activeBranches / totalBranches) * 100) : 100;

    // Real live database orders (0 until orders are logged in Phase 6)
    const realOrders = 0;
    const realGmv = 0;

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

  // 2. 30-Day Real Velocity Timeline
  async getDashboardVelocity(): Promise<VelocityDataPoint[]> {
    const points: VelocityDataPoint[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Live real database orders per day (currently 0)
      points.push({
        date: dateStr,
        orders: 0,
        gmv: 0,
      });
    }

    return points;
  }

  // 3. Recent Tenant Fleet Overview
  async getRecentFleet() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isDeleted: false },
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

