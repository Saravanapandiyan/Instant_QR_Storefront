import { AdminDashboardService } from './admin-dashboard.service';
export declare class AdminDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: AdminDashboardService);
    getStats(): Promise<import("./admin-dashboard.service").AdminDashboardStats>;
    getVelocity(): Promise<import("./admin-dashboard.service").VelocityDataPoint[]>;
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
