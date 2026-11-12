import { PrismaService } from '../prisma/prisma.service';
import { UpdateBranchProductDto } from './dto/update-branch-product.dto';
export declare class BranchProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRestaurantMatrix(restaurantId: string, ownerId: string): Promise<{
        products: ({
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
                sortOrder: number;
            };
            branchProducts: {
                id: string;
                branchId: string;
                productId: string;
                isAvailable: boolean;
                priceOverride: import("@prisma/client/runtime/library").Decimal | null;
                isEnabled: boolean;
            }[];
        } & {
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
            basePrice: import("@prisma/client/runtime/library").Decimal;
            imageUrl: string | null;
        })[];
        branches: {
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
        }[];
        categories: {
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
            sortOrder: number;
        }[];
    } & {
        description: string | null;
        name: string;
        slug: string;
        logoUrl: string | null;
        defaultCurrency: string;
        themeConfig: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        ownerId: string;
        paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
    }>;
    toggleAvailability(branchId: string, productId: string, ownerId: string): Promise<{
        id: string;
        branchId: string;
        productId: string;
        isAvailable: boolean;
        priceOverride: import("@prisma/client/runtime/library").Decimal | null;
        isEnabled: boolean;
    }>;
    updateOverride(branchId: string, productId: string, dto: UpdateBranchProductDto, ownerId: string): Promise<{
        id: string;
        branchId: string;
        productId: string;
        isAvailable: boolean;
        priceOverride: import("@prisma/client/runtime/library").Decimal | null;
        isEnabled: boolean;
    }>;
    getBranchMenu(branchId: string): Promise<{
        branch: {
            id: string;
            name: string;
            slug: string;
            address: string | null;
            phone: string | null;
            countryCode: string | null;
            currency: string;
        };
        restaurant: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue;
        };
        isCrossCurrency: boolean;
        categories: {
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
            sortOrder: number;
        }[];
        items: {
            id: string;
            name: string;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            finalPrice: import("@prisma/client/runtime/library").Decimal | null;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            requiresLocalPrice: boolean;
            imageUrl: string | null;
            categoryId: string;
            categoryName: string;
            isAvailable: boolean;
            isEnabled: boolean;
        }[];
    }>;
}
