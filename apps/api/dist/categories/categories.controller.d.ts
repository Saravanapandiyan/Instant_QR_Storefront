import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
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
    findAllByRestaurant(restaurantId: string): Promise<({
        _count: {
            products: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
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
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
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
    remove(id: string, user: any): Promise<{
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
