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
exports.AdminRestaurantsService = exports.AdminRestaurantsQuery = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const credits_service_1 = require("../credits/credits.service");
class AdminRestaurantsQuery {
    search;
    status;
    planTier;
}
exports.AdminRestaurantsQuery = AdminRestaurantsQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminRestaurantsQuery.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminRestaurantsQuery.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminRestaurantsQuery.prototype, "planTier", void 0);
let AdminRestaurantsService = class AdminRestaurantsService {
    prisma;
    authService;
    creditsService;
    constructor(prisma, authService, creditsService) {
        this.prisma = prisma;
        this.authService = authService;
        this.creditsService = creditsService;
    }
    async getRestaurants(query) {
        const { search, status = 'ALL', planTier = 'ALL' } = query;
        const where = { isDeleted: false };
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
        }
        else if (status === 'SUSPENDED') {
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
            const tier = isPaid ? 'PAID' : 'FREE';
            if (tier === 'PAID') {
                paidCount++;
            }
            else {
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
        const filtered = planTier === 'ALL'
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
    async getRestaurantById(id) {
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
            throw new common_1.NotFoundException('Restaurant tenant not found');
        }
        return {
            ...restaurant,
            status: restaurant.isActive ? 'ACTIVE' : 'SUSPENDED',
        };
    }
    async updateRestaurantStatus(id, isActive) {
        const existing = await this.prisma.restaurant.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Restaurant tenant not found');
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
    async adjustRestaurantCredits(restaurantId, delta, reason, notes, adminUserId) {
        return this.creditsService.adjustCredits({
            restaurantId,
            delta,
            reason: reason || 'ADMIN_ADJUSTMENT',
            notes,
        }, adminUserId);
    }
    async impersonateRestaurant(restaurantId) {
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
            throw new common_1.NotFoundException(`Restaurant ${restaurantId} not found`);
        }
        if (!restaurant.owner) {
            throw new common_1.NotFoundException(`Restaurant has no associated owner account`);
        }
        const token = this.authService.generateToken(restaurant.owner.id, restaurant.owner.email, restaurant.owner.role);
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
};
exports.AdminRestaurantsService = AdminRestaurantsService;
exports.AdminRestaurantsService = AdminRestaurantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        credits_service_1.CreditsService])
], AdminRestaurantsService);
//# sourceMappingURL=admin-restaurants.service.js.map