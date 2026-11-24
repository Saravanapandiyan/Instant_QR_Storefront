import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { QuickSetupDto } from './dto/ai.dto';
export declare class AiService {
    private readonly prisma;
    private readonly storageService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: StorageService);
    private getGeminiKey;
    private slugify;
    private generateUniqueRestaurantSlug;
    private generateUniqueBranchSlug;
    private callGemini;
    private normalizeMenuCategories;
    generateDishDescription(dishName: string, categoryName?: string): Promise<string>;
    findDishImage(dishName: string): Promise<{
        imageUrl: string;
        source: 'unsplash' | 'curated' | 'fallback';
    }>;
    private matchCuratedFoodPhoto;
    parseMenuImage(fileBuffer: Buffer, mimeType: string): Promise<{
        success: boolean;
        categories: {
            name: any;
            items: any[];
        }[];
    }>;
    bulkImportMenu(restaurantId: string, categories: any[]): Promise<{
        success: boolean;
        message: string;
        categoriesCreated: number;
        productsCreated: number;
    }>;
    enrichMenu(categories: any[]): Promise<{
        name: any;
        items: any[];
    }[]>;
    executeQuickSetup(ownerId: string, dto: QuickSetupDto): Promise<{
        success: boolean;
        message: string;
        restaurant: {
            id: string;
            name: string;
            slug: string;
            currency: string;
            creditBalance: number;
        };
        branch: {
            id: string;
            name: string;
            slug: string;
            storefrontPath: string;
        };
        counts: {
            categoriesCount: number;
            productsCount: number;
            freeCredits: number;
        };
        staff: {
            name: string | undefined;
            email: string | undefined;
            role: string;
            pinCode: string | null;
        } | null;
    }>;
    getSupportedLanguages(): {
        code: string;
        name: string;
        nativeName: string;
        flag: string;
    }[];
    translateMenu(restaurantId: string, targetLanguages: string[]): Promise<{
        success: boolean;
        message: string;
        totalUpdated: number;
        languages?: undefined;
    } | {
        success: boolean;
        languages: string[];
        totalUpdated: number;
        message: string;
    }>;
    updateProductTranslation(productId: string, langCode: string, name: string, description?: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        restaurantId: string;
        translations: import("@prisma/client/runtime/library").JsonValue | null;
        categoryId: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
    }>;
    updateCategoryTranslation(categoryId: string, langCode: string, name: string, description?: string): Promise<{
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
        translations: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
