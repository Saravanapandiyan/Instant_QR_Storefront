import { AdminBranchesService, AdminBranchesQuery, CreateAdminBranchDto, UpdateAdminBranchDto, CreateAdminTableDto } from './admin-branches.service';
export declare class AdminBranchesController {
    private readonly branchesService;
    constructor(branchesService: AdminBranchesService);
    getBranches(query: AdminBranchesQuery): Promise<{
        counts: {
            total: number;
            active: number;
            inactive: number;
        };
        branches: {
            id: string;
            name: string;
            slug: string;
            address: string | null;
            phone: string | null;
            rawPhone: string | null;
            countryCode: string | null;
            currency: string;
            isActive: boolean;
            restaurantId: string;
            restaurant: {
                name: string;
                slug: string;
                logoUrl: string | null;
                defaultCurrency: string;
                id: string;
            };
            tablesCount: number;
            ordersCount: number;
            productsCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getBranchById(id: string): Promise<{
        restaurant: {
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            id: string;
        };
        _count: {
            orders: number;
            branchProducts: number;
            tables: number;
        };
        tables: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tableNumber: string;
            section: string;
            branchId: string;
            capacity: number;
        }[];
    } & {
        name: string;
        slug: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        address: string | null;
        phone: string | null;
        countryCode: string | null;
        currency: string;
    }>;
    createBranch(body: CreateAdminBranchDto): Promise<{
        restaurant: {
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            id: string;
        };
        _count: {
            orders: number;
            branchProducts: number;
            tables: number;
        };
        tables: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tableNumber: string;
            section: string;
            branchId: string;
            capacity: number;
        }[];
    } & {
        name: string;
        slug: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        address: string | null;
        phone: string | null;
        countryCode: string | null;
        currency: string;
    }>;
    updateBranch(id: string, body: UpdateAdminBranchDto): Promise<{
        restaurant: {
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            id: string;
        };
        _count: {
            orders: number;
            branchProducts: number;
            tables: number;
        };
        tables: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tableNumber: string;
            section: string;
            branchId: string;
            capacity: number;
        }[];
    } & {
        name: string;
        slug: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        address: string | null;
        phone: string | null;
        countryCode: string | null;
        currency: string;
    }>;
    deleteBranch(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getTables(branchId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tableNumber: string;
        section: string;
        branchId: string;
        capacity: number;
    }[]>;
    createTable(branchId: string, body: CreateAdminTableDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tableNumber: string;
        section: string;
        branchId: string;
        capacity: number;
    }>;
    deleteTable(tableId: string): Promise<{
        success: boolean;
    }>;
}
