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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRestaurantAnalytics(restaurantId, userId, query) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { id: true, ownerId: true, name: true, defaultCurrency: true, isDeleted: true },
        });
        if (!restaurant || restaurant.isDeleted) {
            throw new common_1.NotFoundException('Restaurant not found');
        }
        let staffAssignedBranches = null;
        if (restaurant.ownerId !== userId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId, userId } },
            });
            if (!staff || !staff.isActive) {
                throw new common_1.ForbiddenException('You do not have access to this restaurant');
            }
            const assigned = Array.isArray(staff.assignedBranches)
                ? staff.assignedBranches
                : [];
            if (!assigned.includes('ALL') && assigned.length > 0) {
                staffAssignedBranches = assigned;
            }
        }
        const where = {
            restaurantId,
            status: { not: client_1.OrderStatus.CANCELLED },
        };
        if (query.branchId && query.branchId !== 'ALL') {
            if (staffAssignedBranches && !staffAssignedBranches.includes(query.branchId)) {
                throw new common_1.ForbiddenException('You do not have access to this branch');
            }
            where.branchId = query.branchId;
        }
        else if (staffAssignedBranches) {
            where.branchId = { in: staffAssignedBranches };
        }
        const now = new Date();
        if (query.period === 'today') {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            where.createdAt = { gte: startOfDay };
        }
        else if (query.period === '7d') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            where.createdAt = { gte: sevenDaysAgo };
        }
        else if (query.period === '30d') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            where.createdAt = { gte: thirtyDaysAgo };
        }
        else if (query.period === 'custom' || query.startDate || query.endDate) {
            const dateRange = {};
            if (query.startDate) {
                const start = /^\d{4}-\d{2}-\d{2}$/.test(query.startDate)
                    ? new Date(`${query.startDate}T00:00:00`)
                    : new Date(query.startDate);
                if (!Number.isNaN(start.getTime()))
                    dateRange.gte = start;
            }
            if (query.endDate) {
                const end = /^\d{4}-\d{2}-\d{2}$/.test(query.endDate)
                    ? new Date(`${query.endDate}T23:59:59.999`)
                    : new Date(query.endDate);
                if (!Number.isNaN(end.getTime()))
                    dateRange.lte = end;
            }
            if (Object.keys(dateRange).length > 0) {
                where.createdAt = dateRange;
            }
        }
        const orders = await this.prisma.order.findMany({
            where,
            include: {
                items: true,
                branch: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        let totalGrossRevenue = 0;
        let totalTax = 0;
        let completedOrders = 0;
        let dineInOrders = 0;
        let takeawayOrders = 0;
        let cashOrdersCount = 0;
        let cashCollected = 0;
        let onlineOrdersCount = 0;
        let onlineCollected = 0;
        let totalPrepTimeMinutes = 0;
        let prepOrdersCount = 0;
        const hourlyMap = {};
        for (let i = 0; i < 24; i++) {
            hourlyMap[i] = { count: 0, revenue: 0 };
        }
        const dishMap = {};
        const dailyMap = {};
        for (const ord of orders) {
            const amt = Number(ord.totalAmount) || 0;
            totalGrossRevenue += amt;
            totalTax += Number(ord.tax) || 0;
            if (ord.status === client_1.OrderStatus.COMPLETED) {
                completedOrders++;
            }
            if (ord.orderType === client_1.OrderType.DINE_IN) {
                dineInOrders++;
            }
            else {
                takeawayOrders++;
            }
            const isCash = ord.paymentMethod === client_1.PaymentMethod.CASH ||
                ord.paymentMethod === 'CASH_ON_COUNTER';
            if (isCash) {
                cashOrdersCount++;
                if (ord.paymentStatus === client_1.PaymentStatus.PAID) {
                    cashCollected += amt;
                }
            }
            else {
                onlineOrdersCount++;
                if (ord.paymentStatus === client_1.PaymentStatus.PAID) {
                    onlineCollected += amt;
                }
            }
            if (ord.prepTimeMinutes && ord.prepTimeMinutes > 0) {
                totalPrepTimeMinutes += ord.prepTimeMinutes;
                prepOrdersCount++;
            }
            const orderDate = new Date(ord.createdAt);
            const hour = orderDate.getHours();
            if (hourlyMap[hour]) {
                hourlyMap[hour].count += 1;
                hourlyMap[hour].revenue += amt;
            }
            const dateKey = orderDate.toISOString().split('T')[0];
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { date: dateKey, count: 0, revenue: 0 };
            }
            dailyMap[dateKey].count += 1;
            dailyMap[dateKey].revenue += amt;
            for (const item of ord.items) {
                const dishKey = item.productName || 'Dish';
                if (!dishMap[dishKey]) {
                    dishMap[dishKey] = { name: dishKey, quantity: 0, revenue: 0 };
                }
                dishMap[dishKey].quantity += item.quantity;
                dishMap[dishKey].revenue += Number(item.totalPrice) || 0;
            }
        }
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? Math.round((totalGrossRevenue / totalOrders) * 100) / 100 : 0;
        const averagePrepTimeMinutes = prepOrdersCount > 0 ? Math.round((totalPrepTimeMinutes / prepOrdersCount) * 10) / 10 : 15;
        const hourlyPeak = Object.entries(hourlyMap).map(([hourStr, data]) => {
            const h = Number(hourStr);
            const period = h >= 12 ? 'PM' : 'AM';
            const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return {
                hour: h,
                label: `${displayHour} ${period}`,
                orderCount: data.count,
                revenue: Math.round(data.revenue * 100) / 100,
            };
        });
        const topDishes = Object.values(dishMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        const timeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
        return {
            restaurantId,
            restaurantName: restaurant.name,
            currency: restaurant.defaultCurrency || 'INR',
            period: query.period || 'today',
            summary: {
                totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
                totalTax: Math.round(totalTax * 100) / 100,
                totalOrders,
                completedOrders,
                dineInOrders,
                takeawayOrders,
                cashOrdersCount,
                cashCollected: Math.round(cashCollected * 100) / 100,
                onlineOrdersCount,
                onlineCollected: Math.round(onlineCollected * 100) / 100,
                averageOrderValue,
                averagePrepTimeMinutes,
            },
            hourlyPeak,
            topDishes,
            timeline,
            recentOrders: orders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                customerPhone: o.customerPhone,
                orderType: o.orderType,
                tableNumber: o.tableNumber,
                status: o.status,
                paymentMethod: o.paymentMethod,
                paymentStatus: o.paymentStatus,
                totalAmount: Number(o.totalAmount),
                createdAt: o.createdAt,
                branchName: o.branch?.name,
            })),
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map