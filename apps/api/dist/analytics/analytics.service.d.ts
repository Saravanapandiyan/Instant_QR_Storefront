import { PrismaService } from '../prisma/prisma.service';
export interface AnalyticsQueryDto {
    branchId?: string;
    period?: 'today' | '7d' | '30d' | 'all';
    startDate?: string;
    endDate?: string;
}
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRestaurantAnalytics(restaurantId: string, userId: string, query: AnalyticsQueryDto): Promise<{
        restaurantId: string;
        restaurantName: string;
        currency: string;
        period: "all" | "7d" | "today" | "30d";
        summary: {
            totalGrossRevenue: number;
            totalTax: number;
            totalOrders: number;
            completedOrders: number;
            dineInOrders: number;
            takeawayOrders: number;
            averageOrderValue: number;
            averagePrepTimeMinutes: number;
        };
        hourlyPeak: {
            hour: number;
            label: string;
            orderCount: number;
            revenue: number;
        }[];
        topDishes: {
            name: string;
            quantity: number;
            revenue: number;
        }[];
        timeline: {
            date: string;
            count: number;
            revenue: number;
        }[];
        recentOrders: {
            id: string;
            orderNumber: number;
            customerName: string;
            customerPhone: string;
            orderType: import("@prisma/client").$Enums.OrderType;
            tableNumber: string | null;
            status: import("@prisma/client").$Enums.OrderStatus;
            totalAmount: number;
            createdAt: Date;
            branchName: string;
        }[];
    }>;
}
