import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBranchProductDto } from './dto/update-branch-product.dto';

@Injectable()
export class BranchProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // 0. Get full branch product availability & pricing matrix for an entire restaurant concept
  async getRestaurantMatrix(restaurantId: string, ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        branches: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
        categories: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          where: { isDeleted: false },
          include: {
            category: true,
            branchProducts: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!restaurant || restaurant.isDeleted) {
      throw new NotFoundException('Restaurant concept not found');
    }

    if (restaurant.ownerId !== ownerId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId, userId: ownerId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.menu?.view) {
        throw new ForbiddenException('You do not have permission to view this restaurant menu');
      }
    }

    return restaurant;
  }

  // 1. One-click Toggle "In-Stock / Sold Out" for a specific branch
  async toggleAvailability(branchId: string, productId: string, ownerId: string) {
    // Verify branch ownership
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    if (!branch || branch.isDeleted) {
      throw new NotFoundException('Branch not found');
    }

    if (branch.restaurant.ownerId !== ownerId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.menu?.toggleStock) {
        throw new ForbiddenException('You do not have permission to change stock in this branch');
      }
    }

    // Verify product exists and belongs to the same restaurant concept
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.isDeleted || product.restaurantId !== branch.restaurantId) {
      throw new NotFoundException('Product not found in this restaurant catalog');
    }

    // Upsert BranchProduct: if exists toggle isAvailable, if not create with isAvailable: false
    const existing = await this.prisma.branchProduct.findUnique({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },
    });

    if (existing) {
      return this.prisma.branchProduct.update({
        where: { id: existing.id },
        data: { isAvailable: !existing.isAvailable },
      });
    }

    return this.prisma.branchProduct.create({
      data: {
        branchId,
        productId,
        isAvailable: false,
        isEnabled: true,
      },
    });
  }

  // 2. Update stock availability, price override, or enablement
  async updateOverride(
    branchId: string,
    productId: string,
    dto: UpdateBranchProductDto,
    ownerId: string,
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    if (!branch || branch.isDeleted) {
      throw new NotFoundException('Branch not found');
    }

    if (branch.restaurant.ownerId !== ownerId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.menu?.toggleStock) {
        throw new ForbiddenException('You do not have permission to change stock in this branch');
      }
    }

    return this.prisma.branchProduct.upsert({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },
      update: {
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
        ...(dto.priceOverride !== undefined ? { priceOverride: dto.priceOverride } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      },
      create: {
        branchId,
        productId,
        isAvailable: dto.isAvailable ?? true,
        priceOverride: dto.priceOverride,
        isEnabled: dto.isEnabled ?? true,
      },
    });
  }

  // 3. Get Complete Dining Menu for a Branch (Used by Customer Storefront QR code)
  async getBranchMenu(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        restaurant: true,
        branchProducts: true,
      },
    });

    if (!branch || branch.isDeleted) {
      throw new NotFoundException('Branch not found');
    }

    // Get all categories for this restaurant
    const categories = await this.prisma.category.findMany({
      where: {
        restaurantId: branch.restaurantId,
        isActive: true,
        isDeleted: false,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Get all products for this restaurant
    const products = await this.prisma.product.findMany({
      where: {
        restaurantId: branch.restaurantId,
        isDeleted: false,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map branch overrides into each product
    const branchProductMap = new Map(
      branch.branchProducts.map((bp) => [bp.productId, bp]),
    );

    const branchCurrency = branch.currency || 'INR';
    const brandCurrency = branch.restaurant.defaultCurrency || 'INR';
    const isCrossCurrency = branchCurrency !== brandCurrency;

    const items = products
      .map((p) => {
        const override = branchProductMap.get(p.id);
        const isEnabled = override ? override.isEnabled : true;
        const isAvailable = override ? override.isAvailable : true;
        const hasOverride =
          override?.priceOverride !== null &&
          override?.priceOverride !== undefined;

        // If cross-currency and no override provided, local price is required
        const requiresLocalPrice = isCrossCurrency && !hasOverride;
        const finalPrice = hasOverride
          ? override!.priceOverride
          : isCrossCurrency
            ? null
            : p.basePrice;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          basePrice: p.basePrice,
          finalPrice,
          priceOverride: override?.priceOverride ?? null,
          requiresLocalPrice,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          isAvailable,
          isEnabled,
        };
      })
      .filter((p) => p.isEnabled);

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.address,
        phone: branch.phone,
        countryCode: branch.countryCode,
        currency: branchCurrency,
      },
      restaurant: {
        id: branch.restaurant.id,
        name: branch.restaurant.name,
        slug: branch.restaurant.slug,
        description: branch.restaurant.description,
        logoUrl: branch.restaurant.logoUrl,
        defaultCurrency: brandCurrency,
        themeConfig: branch.restaurant.themeConfig,
        paymentConfig: branch.restaurant.paymentConfig,
      },
      isCrossCurrency,
      categories,
      items,
    };
  }
}
