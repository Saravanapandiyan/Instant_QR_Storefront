import { AiService } from './ai.service';
import { QuickSetupDto, GenerateDescriptionDto, SearchDishImageDto, TranslateMenuDto, UpdateTranslationDto } from './dto/ai.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    parseMenu(file?: Express.Multer.File, imageBase64?: string, mimeType?: string): Promise<{
        success: boolean;
        categories: {
            name: any;
            items: any[];
        }[];
    }>;
    generateDescription(dto: GenerateDescriptionDto): Promise<{
        success: boolean;
        description: string;
    }>;
    findImage(dto: SearchDishImageDto): Promise<{
        imageUrl: string;
        source: "unsplash" | "curated" | "fallback";
        success: boolean;
    }>;
    quickSetup(user: any, dto: QuickSetupDto): Promise<{
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
    bulkImport(restaurantId: string, categories: any[]): Promise<{
        success: boolean;
        message: string;
        categoriesCreated: number;
        productsCreated: number;
    }>;
    getSupportedLanguages(): Promise<{
        code: string;
        name: string;
        nativeName: string;
        flag: string;
    }[]>;
    addLanguage(dto: {
        code: string;
        name: string;
        nativeName: string;
        flag?: string;
        direction?: string;
    }): Promise<{
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        nativeName: string;
        flag: string;
        direction: string;
    }>;
    deleteLanguage(code: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    translateMenu(dto: TranslateMenuDto): Promise<{
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
    updateProductTranslation(productId: string, dto: UpdateTranslationDto): Promise<{
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
        translations: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateCategoryTranslation(categoryId: string, dto: UpdateTranslationDto): Promise<{
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
    }>;
}
