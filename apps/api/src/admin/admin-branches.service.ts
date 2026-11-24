import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class AdminBranchesQuery {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export class CreateAdminBranchDto {
  @IsString()
  restaurantId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateAdminBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminTableDto {
  @IsString()
  tableNumber: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;
}

@Injectable()
export class AdminBranchesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get all branches with filtering by restaurant and search
  async getBranches(query: AdminBranchesQuery) {
    const { restaurantId, search, status = 'ALL' } = query;

    const where: any = { isDeleted: false };

    if (restaurantId && restaurantId !== 'ALL') {
      where.restaurantId = restaurantId;
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { restaurant: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [totalCount, activeCount, branches] = await Promise.all([
      this.prisma.branch.count({ where: { isDeleted: false } }),
      this.prisma.branch.count({ where: { isDeleted: false, isActive: true } }),
      this.prisma.branch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              defaultCurrency: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              tables: true,
              orders: true,
              branchProducts: true,
            },
          },
        },
      }),
    ]);

    const formatted = branches.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      address: b.address,
      phone: b.phone ? `${b.countryCode || '+91'} ${b.phone}` : null,
      rawPhone: b.phone,
      countryCode: b.countryCode,
      currency: b.currency,
      isActive: b.isActive,
      restaurantId: b.restaurantId,
      restaurant: b.restaurant,
      tablesCount: b._count.tables,
      ordersCount: b._count.orders,
      productsCount: b._count.branchProducts,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return {
      counts: {
        total: totalCount,
        active: activeCount,
        inactive: totalCount - activeCount,
      },
      branches: formatted,
    };
  }

  // 2. Get single branch details with tables
  async getBranchById(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, isDeleted: false },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            defaultCurrency: true,
            logoUrl: true,
          },
        },
        tables: {
          orderBy: { tableNumber: 'asc' },
        },
        _count: {
          select: {
            tables: true,
            orders: true,
            branchProducts: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found.`);
    }

    return branch;
  }

  // 3. Super Admin: Create a new branch
  async createBranch(dto: CreateAdminBranchDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${dto.restaurantId} not found.`);
    }

    let slug = dto.slug ? dto.slug.trim().toLowerCase() : '';
    if (!slug) {
      const baseSlug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      slug = `${restaurant.slug}-${baseSlug}`;
    }

    const existingSlug = await this.prisma.branch.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const branch = await this.prisma.branch.create({
      data: {
        restaurantId: dto.restaurantId,
        name: dto.name.trim(),
        slug,
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
        countryCode: dto.countryCode || '+91',
        currency: dto.currency || restaurant.defaultCurrency || 'INR',
        isActive: true,
      },
    });

    // Auto-provision 4 initial tables so QR codes are instantly testable
    await this.prisma.restaurantTable.createMany({
      data: [
        { branchId: branch.id, tableNumber: 'Table 1', section: 'Main Hall', capacity: 4 },
        { branchId: branch.id, tableNumber: 'Table 2', section: 'Main Hall', capacity: 4 },
        { branchId: branch.id, tableNumber: 'Table 3', section: 'Main Hall', capacity: 6 },
        { branchId: branch.id, tableNumber: 'Counter 1', section: 'Takeaway', capacity: 2 },
      ],
      skipDuplicates: true,
    });

    return this.getBranchById(branch.id);
  }

  // 4. Super Admin: Update a branch
  async updateBranch(id: string, dto: UpdateAdminBranchDto) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, isDeleted: false },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.slug && dto.slug.trim().toLowerCase() !== branch.slug) {
      const slug = dto.slug.trim().toLowerCase();
      const existing = await this.prisma.branch.findUnique({ where: { slug } });
      if (existing) throw new ConflictException(`Slug "/r/${slug}" is already in use.`);
      data.slug = slug;
    }

    await this.prisma.branch.update({
      where: { id },
      data,
    });

    return this.getBranchById(id);
  }

  // 5. Super Admin: Soft delete branch
  async deleteBranch(id: string, adminUserId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, isDeleted: false },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${id} not found.`);
    }

    await this.prisma.branch.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminUserId,
      },
    });

    return {
      success: true,
      message: `Branch "${branch.name}" successfully archived.`,
    };
  }

  // 6. Table Management
  async getTables(branchId: string) {
    return this.prisma.restaurantTable.findMany({
      where: { branchId },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async createTable(branchId: string, dto: CreateAdminTableDto) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, isDeleted: false } });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found.`);

    const existing = await this.prisma.restaurantTable.findUnique({
      where: { branchId_tableNumber: { branchId, tableNumber: dto.tableNumber.trim() } },
    });

    if (existing) {
      throw new ConflictException(`Table "${dto.tableNumber}" already exists in this outlet.`);
    }

    return this.prisma.restaurantTable.create({
      data: {
        branchId,
        tableNumber: dto.tableNumber.trim(),
        section: dto.section?.trim() || 'Main Hall',
        capacity: dto.capacity || 4,
        isActive: true,
      },
    });
  }

  async deleteTable(tableId: string) {
    await this.prisma.restaurantTable.delete({
      where: { id: tableId },
    });
    return { success: true };
  }
}
