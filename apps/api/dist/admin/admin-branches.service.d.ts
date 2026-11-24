import { PrismaService } from '../prisma/prisma.service';
export declare class AdminBranchesQuery {
    restaurantId?: string;
    search?: string;
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
}
export declare class CreateAdminBranchDto {
    restaurantId: string;
    name: string;
    slug?: string;
    address?: string;
    phone?: string;
    countryCode?: string;
    currency?: string;
}
export declare class UpdateAdminBranchDto {
    name?: string;
    slug?: string;
    address?: string;
    phone?: string;
    countryCode?: string;
    currency?: string;
    isActive?: boolean;
}
export declare class CreateAdminTableDto {
    tableNumber: string;
    section?: string;
    capacity?: number;
}
export declare class AdminBranchesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    createBranch(dto: CreateAdminBranchDto): Promise<{
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
    updateBranch(id: string, dto: UpdateAdminBranchDto): Promise<{
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
    deleteBranch(id: string, adminUserId: string): Promise<{
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
    createTable(branchId: string, dto: CreateAdminTableDto): Promise<{
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
