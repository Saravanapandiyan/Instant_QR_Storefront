import 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, file?: Express.Multer.File): Promise<{
        category: {
            name: string;
            id: string;
        };
    } & {
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
    findAllByRestaurant(restaurantId: string, categoryId?: string, search?: string, page?: number, limit?: number): Promise<({
        category: {
            name: string;
            id: string;
        };
        branchProducts: {
            id: string;
            branchId: string;
            productId: string;
            isAvailable: boolean;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            isEnabled: boolean;
        }[];
    } & {
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
    })[] | {
        data: ({
            category: {
                name: string;
                id: string;
            };
            branchProducts: {
                id: string;
                branchId: string;
                productId: string;
                isAvailable: boolean;
                priceOverride: import("@prisma/client/runtime/library").Decimal | null;
                isEnabled: boolean;
            }[];
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        category: {
            name: string;
            id: string;
        };
        branchProducts: {
            id: string;
            branchId: string;
            productId: string;
            isAvailable: boolean;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            isEnabled: boolean;
        }[];
    } & {
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
    update(id: string, updateProductDto: UpdateProductDto, file?: Express.Multer.File): Promise<{
        category: {
            name: string;
            id: string;
        };
        branchProducts: {
            id: string;
            branchId: string;
            productId: string;
            isAvailable: boolean;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            isEnabled: boolean;
        }[];
    } & {
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
    remove(id: string, user: any): Promise<{
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
}
