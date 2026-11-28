import { HelpService } from './help.service';
import { CreateHelpArticleDto, UpdateHelpArticleDto } from './dto/help-article.dto';
export declare class HelpController {
    private readonly helpService;
    constructor(helpService: HelpService);
    getArticles(audience?: string, category?: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        audience: string;
        sortOrder: number;
        isPublished: boolean;
    }[]>;
    getArticleBySlug(slug: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        audience: string;
        sortOrder: number;
        isPublished: boolean;
    }>;
    getAllAdmin(audience?: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        audience: string;
        sortOrder: number;
        isPublished: boolean;
    }[]>;
    create(dto: CreateHelpArticleDto): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        audience: string;
        sortOrder: number;
        isPublished: boolean;
    }>;
    update(id: string, dto: UpdateHelpArticleDto): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        audience: string;
        sortOrder: number;
        isPublished: boolean;
    }>;
    delete(id: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        audience: string;
        sortOrder: number;
        isPublished: boolean;
    }>;
}
