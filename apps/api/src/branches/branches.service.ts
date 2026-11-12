import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper 1: Convert text into a clean URL slug
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper 2: Generate unique branch slug
  private async generateUniqueSlug(baseText: string): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'branch';
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.branch.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // 1. Create a new physical branch under a restaurant
  async create(createDto: CreateBranchDto, ownerId: string) {
    // Verify parent restaurant exists and is owned by current user
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: createDto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${createDto.restaurantId}" not found`);
    }

    if (restaurant.ownerId !== ownerId) {
      // Check if user is staff with branches.create permission
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: createDto.restaurantId, userId: ownerId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.branches?.create) {
        throw new ForbiddenException('You do not have permission to add branches to this restaurant');
      }
    }

    let slug: string;
    if (createDto.slug) {
      slug = this.slugify(createDto.slug);
      const existing = await this.prisma.branch.findUnique({ where: { slug } });
      if (existing) {
        throw new ConflictException(`Branch with storefront slug "${slug}" already exists`);
      }
    } else {
      // Auto-combine restaurant slug and branch name (e.g. ananda-pure-veg-downtown)
      slug = await this.generateUniqueSlug(`${restaurant.slug}-${createDto.name}`);
    }

    // Create branch
    const branch = await this.prisma.branch.create({
      data: {
        restaurantId: createDto.restaurantId,
        name: createDto.name,
        slug,
        address: createDto.address,
        phone: createDto.phone,
        countryCode: createDto.countryCode,
        currency: createDto.currency || restaurant.defaultCurrency || 'INR',
      },
      include: {
        restaurant: true,
      },
    });

    // Automatically seed BranchProduct records for all existing products of this restaurant
    const existingProducts = await this.prisma.product.findMany({
      where: { restaurantId: createDto.restaurantId, isDeleted: false },
      select: { id: true },
    });

    if (existingProducts.length > 0) {
      await this.prisma.branchProduct.createMany({
        data: existingProducts.map((p) => ({
          branchId: branch.id,
          productId: p.id,
          isAvailable: true,
          isEnabled: true,
        })),
        skipDuplicates: true,
      });
    }

    return branch;
  }

  // 2. List all branches accessible by user (Owned or Staff Assigned)
  async findMine(userId: string) {
    // 1. Branches of restaurants owned by user
    const ownedBranches = await this.prisma.branch.findMany({
      where: {
        restaurant: {
          ownerId: userId,
          isDeleted: false,
        },
        isDeleted: false,
      },
      include: {
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Branches of restaurants where user is an active staff member
    const staffMemberships = await this.prisma.staffMember.findMany({
      where: { userId, isActive: true },
      include: {
        restaurant: {
          include: {
            branches: { where: { isDeleted: false }, include: { restaurant: true } },
          },
        },
      },
    });

    const ownedIds = new Set(ownedBranches.map((b) => b.id));
    const staffBranches: any[] = [];

    for (const sm of staffMemberships) {
      if (sm.restaurant.isDeleted) continue;
      const assigned = Array.isArray(sm.assignedBranches)
        ? (sm.assignedBranches as string[])
        : [];
      const isAll = assigned.includes('ALL') || assigned.length === 0;

      for (const b of sm.restaurant.branches) {
        if (!ownedIds.has(b.id)) {
          if (isAll || assigned.includes(b.id)) {
            staffBranches.push(b);
            ownedIds.add(b.id);
          }
        }
      }
    }

    return [...ownedBranches, ...staffBranches];
  }

  // 3. List all branches under a specific restaurant
  async findByRestaurant(restaurantId: string) {
    return this.prisma.branch.findMany({
      where: {
        restaurantId,
        isDeleted: false,
      },
      include: {
        restaurant: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 4. Find branch by public QR storefront slug (e.g. /r/:slug)
  async findBySlug(slug: string) {
    let branch = await this.prisma.branch.findUnique({
      where: { slug },
      include: {
        restaurant: true,
      },
    });

    if (!branch || branch.isDeleted) {
      // Fallback: check if slug belongs to a restaurant and pick its active branch
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { slug },
        include: {
          branches: {
            where: { isActive: true, isDeleted: false },
            include: { restaurant: true },
            take: 1,
          },
        },
      });

      if (restaurant && restaurant.branches.length > 0) {
        branch = restaurant.branches[0];
      }
    }

    if (!branch || branch.isDeleted) {
      throw new NotFoundException(`Storefront "${slug}" not found`);
    }

    return branch;
  }

  // 5. Find branch by ID
  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!branch || branch.isDeleted) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }

    return branch;
  }

  // 6. Update branch
  async update(id: string, updateDto: UpdateBranchDto, ownerId: string) {
    const branch = await this.findOne(id);

    if (branch.restaurant.ownerId !== ownerId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.branches?.edit) {
        throw new ForbiddenException('You do not have permission to update this branch');
      }
    }

    const { restaurantId, ...restDto } = updateDto as any;
    const dataToUpdate: any = { ...restDto };

    if (updateDto.slug) {
      const slug = this.slugify(updateDto.slug);
      const existing = await this.prisma.branch.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Storefront slug "${slug}" is already in use`);
      }
      dataToUpdate.slug = slug;
    }

    return this.prisma.branch.update({
      where: { id },
      data: dataToUpdate,
      include: { restaurant: true },
    });
  }

  // 7. Delete branch
  async remove(id: string, ownerId: string) {
    const branch = await this.findOne(id);

    if (branch.restaurant.ownerId !== ownerId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: branch.restaurantId, userId: ownerId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.branches?.delete) {
        throw new ForbiddenException('You do not have permission to delete this branch');
      }
    }

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
