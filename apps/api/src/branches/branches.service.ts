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

  // 8. Tables & Table View: Get all tables for a branch with live open order status
  async getBranchTables(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        tables: {
          where: { isActive: true },
          orderBy: [{ section: 'asc' }, { tableNumber: 'asc' }],
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID "${branchId}" not found`);
    }

    let tables = branch.tables;

    // If branch has no tables configured yet, auto-seed default tables (Table 1 to Table 6)
    if (tables.length === 0) {
      const defaultTables = [
        { tableNumber: 'Table 1', section: 'Main Room', capacity: 2 },
        { tableNumber: 'Table 2', section: 'Main Room', capacity: 4 },
        { tableNumber: 'Table 3', section: 'Main Room', capacity: 4 },
        { tableNumber: 'Table 4', section: 'Main Room', capacity: 6 },
        { tableNumber: 'Table 5', section: 'Outdoor Patio', capacity: 4 },
        { tableNumber: 'Table 6', section: 'Outdoor Patio', capacity: 2 },
      ];

      await this.prisma.restaurantTable.createMany({
        data: defaultTables.map((t) => ({
          branchId,
          ...t,
        })),
        skipDuplicates: true,
      });

      tables = await this.prisma.restaurantTable.findMany({
        where: { branchId, isActive: true },
        orderBy: [{ section: 'asc' }, { tableNumber: 'asc' }],
      });
    }

    // Query open orders for this branch
    const openOrders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
        tableNumber: { not: null },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Match open orders to tables
    return tables.map((t) => {
      const normTable = t.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const activeOrder = openOrders.find((o) => {
        if (!o.tableNumber) return false;
        const normOrderTable = o.tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          normTable === normOrderTable ||
          normTable.includes(normOrderTable) ||
          normOrderTable.includes(normTable)
        );
      });

      return {
        ...t,
        activeOrder: activeOrder
          ? {
              id: activeOrder.id,
              orderNumber: activeOrder.orderNumber,
              status: activeOrder.status,
              totalAmount: Number(activeOrder.totalAmount),
              customerName: activeOrder.customerName,
              itemCount: activeOrder.items.reduce((sum, item) => sum + item.quantity, 0),
              elapsedSeconds: Math.floor(
                (Date.now() - new Date(activeOrder.createdAt).getTime()) / 1000,
              ),
              createdAt: activeOrder.createdAt,
            }
          : null,
      };
    });
  }

  // 9. Create a table
  async createTable(
    branchId: string,
    data: { tableNumber: string; section?: string; capacity?: number },
  ) {
    const existing = await this.prisma.restaurantTable.findUnique({
      where: { branchId_tableNumber: { branchId, tableNumber: data.tableNumber.trim() } },
    });

    if (existing) {
      if (!existing.isActive) {
        return this.prisma.restaurantTable.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            section: data.section?.trim() || existing.section,
            capacity: data.capacity || existing.capacity,
          },
        });
      }
      throw new ConflictException(`Table "${data.tableNumber}" already exists in this branch.`);
    }

    return this.prisma.restaurantTable.create({
      data: {
        branchId,
        tableNumber: data.tableNumber.trim(),
        section: data.section?.trim() || 'Main Room',
        capacity: data.capacity || 4,
      },
    });
  }

  // 10. Bulk create tables
  async bulkCreateTables(
    branchId: string,
    data: {
      section?: string;
      prefix?: string;
      startNumber: number;
      count: number;
      capacity?: number;
    },
  ) {
    const prefix = data.prefix?.trim() || 'Table ';
    const section = data.section?.trim() || 'Main Room';
    const capacity = data.capacity || 4;
    const start = data.startNumber || 1;
    const count = Math.min(Math.max(data.count || 1, 1), 50);

    const created = [];
    for (let i = start; i < start + count; i++) {
      const tableNumber = `${prefix}${i}`;
      try {
        const item = await this.prisma.restaurantTable.upsert({
          where: { branchId_tableNumber: { branchId, tableNumber } },
          create: { branchId, tableNumber, section, capacity },
          update: { isActive: true, section, capacity },
        });
        created.push(item);
      } catch (e) {
        // Skip errors
      }
    }
    return created;
  }

  // 11. Update table
  async updateTable(
    tableId: string,
    data: { tableNumber?: string; section?: string; capacity?: number; isActive?: boolean },
  ) {
    return this.prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        ...(data.tableNumber ? { tableNumber: data.tableNumber.trim() } : {}),
        ...(data.section !== undefined ? { section: data.section.trim() || 'Main Room' } : {}),
        ...(data.capacity !== undefined ? { capacity: Number(data.capacity) || 4 } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  // 12. Delete table
  async deleteTable(tableId: string) {
    return this.prisma.restaurantTable.update({
      where: { id: tableId },
      data: { isActive: false },
    });
  }
}
