export declare class CreateHelpArticleDto {
    title: string;
    slug?: string;
    content: string;
    audience?: string;
    category?: string;
    sortOrder?: number;
    isPublished?: boolean;
}
export declare class UpdateHelpArticleDto {
    title?: string;
    slug?: string;
    content?: string;
    audience?: string;
    category?: string;
    sortOrder?: number;
    isPublished?: boolean;
}
