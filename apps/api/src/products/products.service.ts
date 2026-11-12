import 'multer';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // 1. Create product under a restaurant concept and seed BranchProduct for all existing branches
  async create(createDto: CreateProductDto, file?: Express.Multer.File) {
    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: createDto.restaurantId, isDeleted: false },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Verify category exists and belongs to this restaurant
    const category = await this.prisma.category.findUnique({
      where: { id: createDto.categoryId, isDeleted: false },
    });
    if (!category || category.restaurantId !== createDto.restaurantId) {
      throw new BadRequestException(
        'Category does not exist or does not belong to this restaurant',
      );
    }

    // Handle image file
    let imageUrl = createDto.imageUrl;
    if (file) {
      imageUrl = await this.storageService.uploadFile(file, 'products');
    }

    // Create the master product
    const product = await this.prisma.product.create({
      data: {
        restaurantId: createDto.restaurantId,
        categoryId: createDto.categoryId,
        name: createDto.name,
        description: createDto.description,
        basePrice: createDto.basePrice,
        imageUrl,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Auto-seed BranchProduct for all existing branches of this restaurant
    const branches = await this.prisma.branch.findMany({
      where: { restaurantId: createDto.restaurantId, isDeleted: false },
      select: { id: true },
    });

    if (branches.length > 0) {
      await this.prisma.branchProduct.createMany({
        data: branches.map((b) => ({
          branchId: b.id,
          productId: product.id,
          isAvailable: true,
          isEnabled: true,
        })),
        skipDuplicates: true,
      });
    }

    return product;
  }

  // 2. Get all products for a restaurant (with optional search, category filter, and pagination)
  async findAllByRestaurant(
    restaurantId: string,
    query: {
      categoryId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { categoryId, search, page, limit } = query;

    const where: any = {
      restaurantId,
      isDeleted: false,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            category: { select: { id: true, name: true } },
            branchProducts: true,
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        data: items,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        branchProducts: true,
      },
    });
  }

  // 3. Find one product by ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, isDeleted: false },
      include: {
        category: { select: { id: true, name: true } },
        branchProducts: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // 4. Update product details (and optionally replace image)
  async update(id: string, updateDto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.findOne(id);

    if (updateDto.categoryId && updateDto.categoryId !== product.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.categoryId, isDeleted: false },
      });
      if (!category || category.restaurantId !== product.restaurantId) {
        throw new BadRequestException(
          'New category does not belong to this restaurant',
        );
      }
    }

    let imageUrl = updateDto.imageUrl;
    if (file) {
      if (product.imageUrl) {
        await this.storageService.deleteFile(product.imageUrl);
      }
      imageUrl = await this.storageService.uploadFile(file, 'products');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateDto,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        branchProducts: true,
      },
    });
  }

  // 5. Soft-delete a product
  async remove(id: string, userId: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
