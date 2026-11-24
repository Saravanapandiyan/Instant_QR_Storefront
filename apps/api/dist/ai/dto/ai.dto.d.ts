export declare class MenuItemDto {
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
}
export declare class MenuCategoryDto {
    name: string;
    items: MenuItemDto[];
}
export declare class QuickSetupDto {
    restaurantName: string;
    currency?: string;
    serviceType?: string;
    tablesCount?: number;
    staffName?: string;
    staffEmail?: string;
    staffPassword?: string;
    staffRole?: string;
    staffPin?: string;
    categories?: MenuCategoryDto[];
}
export declare class GenerateDescriptionDto {
    dishName: string;
    categoryName?: string;
}
export declare class SearchDishImageDto {
    dishName: string;
}
export declare class TranslateMenuDto {
    restaurantId: string;
    targetLanguages: string[];
}
export declare class UpdateTranslationDto {
    langCode: string;
    name: string;
    description?: string;
}
