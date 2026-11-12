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
export declare class AdminDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<AdminDashboardStats>;
    getDashboardVelocity(): Promise<VelocityDataPoint[]>;
    getRecentFleet(): Promise<{
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        owner: {
            name: string;
            id: string;
            phone: string | null;
            countryCode: string | null;
            email: string;
        };
        branchesCount: number;
        productsCount: number;
        currency: string;
        status: string;
        createdAt: Date;
    }[]>;
}
