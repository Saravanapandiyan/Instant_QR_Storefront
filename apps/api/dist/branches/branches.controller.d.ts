import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    create(user: any, createDto: CreateBranchDto): Promise<{
        restaurant: {
            description: string | null;
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            ownerId: string;
            creditBalance: number;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
        };
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
    findMine(user: any): Promise<any[]>;
    findByRestaurant(restaurantId: string): Promise<({
        restaurant: {
            description: string | null;
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            ownerId: string;
            creditBalance: number;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
        };
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
    })[]>;
    findBySlug(slug: string): Promise<{
        restaurant: {
            description: string | null;
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            ownerId: string;
            creditBalance: number;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
        };
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
    findOne(id: string): Promise<{
        restaurant: {
            description: string | null;
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            ownerId: string;
            creditBalance: number;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
        };
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
    update(id: string, updateDto: UpdateBranchDto, user: any): Promise<{
        restaurant: {
            description: string | null;
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            ownerId: string;
            creditBalance: number;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
        };
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
    remove(id: string, user: any): Promise<{
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
    getTables(branchId: string): Promise<{
        activeOrder: {
            id: string;
            orderNumber: number;
            status: import("@prisma/client").$Enums.OrderStatus;
            totalAmount: number;
            customerName: string;
            itemCount: number;
            elapsedSeconds: number;
            createdAt: Date;
        } | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tableNumber: string;
        section: string;
        branchId: string;
        capacity: number;
    }[]>;
    createTable(branchId: string, body: {
        tableNumber: string;
        section?: string;
        capacity?: number;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tableNumber: string;
        section: string;
        branchId: string;
        capacity: number;
    }>;
    bulkCreateTables(branchId: string, body: {
        section?: string;
        prefix?: string;
        startNumber: number;
        count: number;
        capacity?: number;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tableNumber: string;
        section: string;
        branchId: string;
        capacity: number;
    }[]>;
    updateTable(tableId: string, body: {
        tableNumber?: string;
        section?: string;
        capacity?: number;
        isActive?: boolean;
    }): Promise<{
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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tableNumber: string;
        section: string;
        branchId: string;
        capacity: number;
    }>;
}
