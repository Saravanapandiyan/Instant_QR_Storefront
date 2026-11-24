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
exports.AdminDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminDashboardService = class AdminDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats(restaurantId, branchId, days = 30) {
        const isRestaurantScoped = restaurantId && restaurantId !== 'ALL';
        const isBranchScoped = branchId && branchId !== 'ALL';
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - (days || 30));
        const restWhere = { isDeleted: false };
        if (isRestaurantScoped) {
            restWhere.id = restaurantId;
        }
        const branchWhere = { isDeleted: false };
        if (isRestaurantScoped) {
            branchWhere.restaurantId = restaurantId;
        }
        if (isBranchScoped) {
            branchWhere.id = branchId;
        }
        const prodWhere = { isDeleted: false };
        if (isRestaurantScoped) {
            prodWhere.restaurantId = restaurantId;
        }
        if (isBranchScoped) {
            prodWhere.branchProducts = { some: { branchId } };
        }
        const catWhere = { isDeleted: false };
        if (isRestaurantScoped) {
            catWhere.restaurantId = restaurantId;
        }
        const orderWhere = {
            createdAt: { gte: dateLimit },
        };
        if (isRestaurantScoped) {
            orderWhere.restaurantId = restaurantId;
        }
        if (isBranchScoped) {
            orderWhere.branchId = branchId;
        }
        const [totalRestaurants, activeRestaurants, totalBranches, activeBranches, totalProducts, totalCategories, totalUsers, totalOwners, totalSuperAdmins, orderAgg,] = await Promise.all([
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
    async getDashboardVelocity(restaurantId, branchId, days = 30) {
        const isRestaurantScoped = restaurantId && restaurantId !== 'ALL';
        const isBranchScoped = branchId && branchId !== 'ALL';
        const numDays = Math.max(1, Math.min(days || 30, 90));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);
        const orderWhere = {
            createdAt: { gte: startDate },
        };
        if (isRestaurantScoped) {
            orderWhere.restaurantId = restaurantId;
        }
        if (isBranchScoped) {
            orderWhere.branchId = branchId;
        }
        const orders = await this.prisma.order.findMany({
            where: orderWhere,
            select: {
                totalAmount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const dayMap = new Map();
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
                const cur = dayMap.get(key);
                cur.orders += 1;
                cur.gmv += Number(ord.totalAmount || 0);
            }
        }
        const points = [];
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
    async getRecentFleet(restaurantId) {
        const isRestaurantScoped = restaurantId && restaurantId !== 'ALL';
        const where = { isDeleted: false };
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
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map