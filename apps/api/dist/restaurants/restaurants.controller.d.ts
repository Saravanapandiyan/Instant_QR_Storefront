import 'multer';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
export declare class RestaurantsController {
    private readonly restaurantsService;
    constructor(restaurantsService: RestaurantsService);
    create(user: any, createDto: CreateRestaurantDto, file?: Express.Multer.File): Promise<{
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
        _count: {
            products: number;
            branches: number;
            categories: number;
        };
    } & {
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
    }>;
    findMine(user: any): Promise<({
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
        _count: {
            products: number;
            branches: number;
            categories: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
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
            translations: import("@prisma/client/runtime/library").JsonValue | null;
            sortOrder: number;
        }[];
        _count: {
            products: number;
            branches: number;
            categories: number;
        };
    } & {
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
    }>;
    update(id: string, updateDto: UpdateRestaurantDto, user: any, file?: Express.Multer.File): Promise<{
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
        _count: {
            products: number;
            branches: number;
            categories: number;
        };
    } & {
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
    }>;
    remove(id: string, user: any): Promise<{
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
    }>;
}
