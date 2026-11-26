import { PrismaService } from '../prisma/prisma.service';
import { CreateHelpArticleDto, UpdateHelpArticleDto } from './dto/help-article.dto';
export declare class HelpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getArticlesByAudience(audience?: string, category?: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        content: string;
        audience: string;
        isPublished: boolean;
    }[]>;
    getArticleBySlug(slug: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        content: string;
        audience: string;
        isPublished: boolean;
    }>;
    getAllArticlesAdmin(audience?: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        content: string;
        audience: string;
        isPublished: boolean;
    }[]>;
    createArticle(dto: CreateHelpArticleDto): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        content: string;
        audience: string;
        isPublished: boolean;
    }>;
    updateArticle(id: string, dto: UpdateHelpArticleDto): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        content: string;
        audience: string;
        isPublished: boolean;
    }>;
    deleteArticle(id: string): Promise<{
        category: string;
        title: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        content: string;
        audience: string;
        isPublished: boolean;
    }>;
}
