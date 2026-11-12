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
    async getDashboardStats() {
        const [totalRestaurants, activeRestaurants, totalBranches, activeBranches, totalProducts, totalCategories, totalUsers, totalOwners, totalSuperAdmins,] = await Promise.all([
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
    async getDashboardVelocity() {
        const points = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            points.push({
                date: dateStr,
                orders: 0,
                gmv: 0,
            });
        }
        return points;
    }
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
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map