import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreditsService } from '../credits/credits.service';
export declare class AdminRestaurantsQuery {
    search?: string;
    status?: 'ALL' | 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED';
    planTier?: 'ALL' | 'FREE' | 'PAID';
}
export declare class AdminRestaurantsService {
    private readonly prisma;
    private readonly authService;
    private readonly creditsService;
    constructor(prisma: PrismaService, authService: AuthService, creditsService: CreditsService);
    getRestaurants(query: AdminRestaurantsQuery): Promise<{
        counts: {
            all: number;
            active: number;
            pendingReview: number;
            suspended: number;
            free: number;
            paid: number;
        };
        restaurants: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            logoUrl: string | null;
            defaultCurrency: string;
            creditBalance: number;
            planTier: "PAID" | "FREE";
            isActive: boolean;
            status: string;
            createdAt: Date;
            owner: {
                name: string;
                id: string;
                role: import("@prisma/client").$Enums.Role;
                phone: string | null;
                countryCode: string | null;
                email: string;
            };
            branchesCount: number;
            productsCount: number;
            categoriesCount: number;
            ordersCount: number;
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
        creditBalance: number;
        paymentConfig: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
    }>;
    updateRestaurantStatus(id: string, isActive: boolean): Promise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        status: string;
        message: string;
    }>;
    adjustRestaurantCredits(restaurantId: string, delta: number, reason: string, notes: string | undefined, adminUserId: string): Promise<{
        success: boolean;
        message: string;
        newBalance: number;
        entry: {
            id: string;
            createdAt: Date;
            restaurantId: string;
            delta: number;
            reason: string;
            refId: string | null;
            balanceAfter: number;
        };
    }>;
    impersonateRestaurant(restaurantId: string): Promise<{
        accessToken: string;
        user: {
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            email: string;
        };
        restaurant: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
}
