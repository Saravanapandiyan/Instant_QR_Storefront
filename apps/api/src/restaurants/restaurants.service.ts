import 'multer';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Helper 1: Convert text into a clean URL slug (e.g. "Ananda Pure Veg" -> "ananda-pure-veg")
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper 2: Generate guaranteed unique slug by appending -1, -2 if taken
  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name) || 'restaurant';
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // 1. Create a new Restaurant Concept (with optional uploaded logo file)
  async create(
    createDto: CreateRestaurantDto,
    ownerId: string,
    file?: Express.Multer.File,
  ) {
    let slug: string;

    if (createDto.slug) {
      slug = this.slugify(createDto.slug);
      const existing = await this.prisma.restaurant.findUnique({
        where: { slug },
      });

      if (existing) {
        throw new ConflictException(
          `Restaurant with slug "${slug}" already exists`,
        );
      }
    } else {
      slug = await this.generateUniqueSlug(createDto.name);
    }

    let logoUrl = createDto.logoUrl;
    if (file) {
      logoUrl = await this.storageService.uploadFile(file, 'restaurants');
    }

    return this.prisma.restaurant.create({
      data: {
        name: createDto.name,
        slug,
        description: createDto.description,
        logoUrl,
        defaultCurrency: createDto.defaultCurrency || 'INR',
        ownerId,
      },
      include: {
        branches: true,
        _count: {
          select: { branches: true, categories: true, products: true },
        },
      },
    });
  }

  // 2. List all restaurants owned by or accessible by current user (Owner or Staff)
  async findMine(userId: string) {
    // 1. Fetch restaurants owned by the user
    const ownedRestaurants = await this.prisma.restaurant.findMany({
      where: { ownerId: userId, isDeleted: false },
      include: {
        branches: {
          where: { isDeleted: false },
        },
        _count: {
          select: { branches: true, categories: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch restaurants where user is an active staff member
    const staffMemberships = await this.prisma.staffMember.findMany({
      where: { userId, isActive: true },
      include: {
        restaurant: {
          include: {
            branches: { where: { isDeleted: false } },
            _count: {
              select: { branches: true, categories: true, products: true },
            },
          },
        },
      },
    });

    // Merge without duplicates
    const ownedIds = new Set(ownedRestaurants.map((r) => r.id));
    const staffRestaurants = staffMemberships
      .filter((sm) => !ownedIds.has(sm.restaurant.id) && !sm.restaurant.isDeleted)
      .map((sm) => {
        const assigned = Array.isArray(sm.assignedBranches)
          ? (sm.assignedBranches as string[])
          : [];
        const isAllBranches = assigned.includes('ALL') || assigned.length === 0;

        const filteredBranches = isAllBranches
          ? sm.restaurant.branches
          : sm.restaurant.branches.filter((b) => assigned.includes(b.id));

        return {
          ...sm.restaurant,
          branches: filteredBranches,
          _staffRole: sm.role,
          _staffPermissions: sm.permissions,
        };
      });

    return [...ownedRestaurants, ...staffRestaurants];
  }

  // 3. Find one restaurant by ID with its branches and categories
  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: { where: { isDeleted: false } },
        categories: { where: { isDeleted: false } },
        _count: {
          select: { branches: true, categories: true, products: true },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${id}" not found`);
    }

    return restaurant;
  }

  // 4. Update restaurant concept (with optional new logo file)
  async update(
    id: string,
    updateDto: UpdateRestaurantDto,
    ownerId: string,
    file?: Express.Multer.File,
  ) {
    const restaurant = await this.findOne(id);

    const dataToUpdate: any = { ...updateDto };

    if (updateDto.slug) {
      const slug = this.slugify(updateDto.slug);
      const existing = await this.prisma.restaurant.findUnique({
        where: { slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Restaurant with slug "${slug}" is already in use`,
        );
      }
      dataToUpdate.slug = slug;
    }

    if (file) {
      if (restaurant.logoUrl) {
        await this.storageService.deleteFile(restaurant.logoUrl);
      }
      dataToUpdate.logoUrl = await this.storageService.uploadFile(file, 'restaurants');
    }

    return this.prisma.restaurant.update({
      where: { id },
      data: dataToUpdate,
      include: {
        branches: true,
        _count: {
          select: { branches: true, categories: true, products: true },
        },
      },
    });
  }

  // 5. Delete restaurant
  async remove(id: string, ownerId: string) {
    await this.findOne(id);
    return this.prisma.restaurant.delete({
      where: { id },
    });
  }
}
