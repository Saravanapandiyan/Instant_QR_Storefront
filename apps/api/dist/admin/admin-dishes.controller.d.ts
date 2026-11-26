import { AdminDishesService, AdminDishesQuery, CreateAdminDishDto, UpdateAdminDishDto } from './admin-dishes.service';
export declare class AdminDishesController {
    private readonly dishesService;
    constructor(dishesService: AdminDishesService);
    getDishes(query: AdminDishesQuery): Promise<{
        total: number;
        filteredCount: number;
        dishes: {
            id: string;
            name: string;
            description: string | null;
            basePrice: number;
            imageUrl: string | null;
            restaurantId: string;
            restaurant: {
                name: string;
                slug: string;
                defaultCurrency: string;
                id: string;
            };
            categoryId: string;
            category: {
                name: string;
                id: string;
            };
            inStock: boolean;
            branchProductsCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getDishById(id: string): Promise<{
        basePrice: number;
        restaurant: {
            name: string;
            slug: string;
            defaultCurrency: string;
            id: string;
        };
        category: {
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            restaurantId: string;
            translations: import("@prisma/client/runtime/library").JsonValue | null;
            sortOrder: number;
        };
        branchProducts: ({
            branch: {
                name: string;
                slug: string;
                id: string;
            };
        } & {
            id: string;
            branchId: string;
            productId: string;
            isAvailable: boolean;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            isEnabled: boolean;
        })[];
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        categoryId: string;
        imageUrl: string | null;
        translations: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createDish(body: CreateAdminDishDto): Promise<{
        basePrice: number;
        restaurant: {
            name: string;
            slug: string;
            defaultCurrency: string;
            id: string;
        };
        category: {
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            restaurantId: string;
            translations: import("@prisma/client/runtime/library").JsonValue | null;
            sortOrder: number;
        };
        branchProducts: ({
            branch: {
                name: string;
                slug: string;
                id: string;
            };
        } & {
            id: string;
            branchId: string;
            productId: string;
            isAvailable: boolean;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            isEnabled: boolean;
        })[];
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        categoryId: string;
        imageUrl: string | null;
        translations: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateDish(id: string, body: UpdateAdminDishDto): Promise<{
        basePrice: number;
        restaurant: {
            name: string;
            slug: string;
            defaultCurrency: string;
            id: string;
        };
        category: {
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            restaurantId: string;
            translations: import("@prisma/client/runtime/library").JsonValue | null;
            sortOrder: number;
        };
        branchProducts: ({
            branch: {
                name: string;
                slug: string;
                id: string;
            };
        } & {
            id: string;
            branchId: string;
            productId: string;
            isAvailable: boolean;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            isEnabled: boolean;
        })[];
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        categoryId: string;
        imageUrl: string | null;
        translations: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    toggleStock(id: string, body: {
        inStock: boolean;
        branchId?: string;
    }): Promise<{
        success: boolean;
        dishId: string;
        inStock: boolean;
        message: string;
    }>;
    deleteDish(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
