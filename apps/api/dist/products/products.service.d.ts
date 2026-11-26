import 'multer';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private readonly prisma;
    private readonly storageService;
    constructor(prisma: PrismaService, storageService: StorageService);
    create(createDto: CreateProductDto, file?: Express.Multer.File): Promise<{
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
        translations: import("@prisma/client/runtime/library").JsonValue | null;
        categoryId: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
    }>;
    findAllByRestaurant(restaurantId: string, query?: {
        categoryId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<({
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
        translations: import("@prisma/client/runtime/library").JsonValue | null;
        categoryId: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
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
            translations: import("@prisma/client/runtime/library").JsonValue | null;
            categoryId: string;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            imageUrl: string | null;
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
        translations: import("@prisma/client/runtime/library").JsonValue | null;
        categoryId: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
    }>;
    update(id: string, updateDto: UpdateProductDto, file?: Express.Multer.File): Promise<{
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
        translations: import("@prisma/client/runtime/library").JsonValue | null;
        categoryId: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
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
}
