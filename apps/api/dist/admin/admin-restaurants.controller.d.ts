import { AdminRestaurantsService, AdminRestaurantsQuery } from './admin-restaurants.service';
export declare class AdminRestaurantsController {
    private readonly restaurantsService;
    constructor(restaurantsService: AdminRestaurantsService);
    getRestaurants(query: AdminRestaurantsQuery): Promise<{
        counts: {
            all: number;
            active: number;
            pendingReview: number;
            suspended: number;
        };
        restaurants: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            logoUrl: string | null;
            defaultCurrency: string;
            isActive: boolean;
            status: string;
            createdAt: Date;
            owner: {
                name: string;
                id: string;
                phone: string | null;
                countryCode: string | null;
                email: string;
            };
            branchesCount: number;
            productsCount: number;
            categoriesCount: number;
            branches: {
                name: string;
                slug: string;
                id: string;
                isActive: boolean;
                address: string | null;
                phone: string | null;
            }[];
        }[];
    }>;
    getRestaurantById(id: string): Promise<{
        status: string;
        owner: {
            name: string;
            id: string;
            createdAt: Date;
            phone: string | null;
            countryCode: string | null;
            email: string;
        };
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
            name: string;
            id: string;
            isActive: boolean;
            _count: {
                products: number;
            };
            sortOrder: number;
        }[];
        _count: {
            products: number;
            branches: number;
            categories: number;
        };
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
    updateRestaurantStatus(id: string, body: {
        isActive: boolean;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        status: string;
        message: string;
    }>;
}
