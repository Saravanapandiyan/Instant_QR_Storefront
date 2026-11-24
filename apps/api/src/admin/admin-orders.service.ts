import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class AdminOrdersQuery {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class UpdateAdminOrderStatusDto {
  @IsString()
  status: OrderStatus;
}

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get Live Orders stream with scoping & counts
  async getOrders(query: AdminOrdersQuery) {
    const { restaurantId, branchId, status, search, startDate, endDate, page, limit = 50 } = query;

    const where: any = {};

    if (restaurantId && restaurantId !== 'ALL') {
      where.restaurantId = restaurantId;
    }

    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }

    if (status && status !== 'ALL') {
      where.status = status as OrderStatus;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      const num = parseInt(q, 10);
      where.OR = [
        ...(isNaN(num) ? [] : [{ orderNumber: num }]),
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { tableNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        where.createdAt = { ...where.createdAt, gte: d };
      }
    }

    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) {
        if (endDate.length <= 10) {
          d.setHours(23, 59, 59, 999);
        }
        where.createdAt = { ...where.createdAt, lte: d };
      }
    }

    // Base scoping condition for counts
    const scopeWhere: any = {};
    if (restaurantId && restaurantId !== 'ALL') {
      scopeWhere.restaurantId = restaurantId;
    }
    if (branchId && branchId !== 'ALL') {
      scopeWhere.branchId = branchId;
    }

    const currentPage = page && page > 0 ? Number(page) : 1;
    const currentLimit = limit && limit > 0 ? Math.min(Number(limit), 200) : 50;
    const skip = (currentPage - 1) * currentLimit;

    const [
      orders,
      totalCount,
      pendingCount,
      confirmedCount,
      preparingCount,
      readyCount,
      completedCount,
      cancelledCount,
      gmvAggregate,
      totalFiltered,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: currentLimit,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              slug: true,
              currency: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              notes: true,
              productName: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where: scopeWhere }),
      this.prisma.order.count({ where: { ...scopeWhere, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...scopeWhere, status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { ...scopeWhere, status: OrderStatus.PREPARING } }),
      this.prisma.order.count({ where: { ...scopeWhere, status: OrderStatus.READY } }),
      this.prisma.order.count({ where: { ...scopeWhere, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...scopeWhere, status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        where: scopeWhere,
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      restaurantId: o.restaurantId,
      restaurantName: o.restaurant?.name || 'Unknown Restaurant',
      restaurantSlug: o.restaurant?.slug || '',
      branchId: o.branchId,
      branchName: o.branch?.name || 'Main Store',
      branchSlug: o.branch?.slug || '',
      currency: o.branch?.currency || 'INR',
      tableNumber: o.tableNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      orderNotes: o.orderNotes,
      orderType: o.orderType,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: Number(o.subtotal),
      tax: Number(o.tax),
      totalAmount: Number(o.totalAmount),
      prepTimeMinutes: o.prepTimeMinutes,
      itemsCount: o.items.length,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.product?.name || i.productName || 'Menu Dish',
        imageUrl: i.product?.imageUrl || null,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        itemNotes: i.notes,
      })),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return {
      counts: {
        all: totalCount,
        pending: pendingCount,
        active: confirmedCount + preparingCount + readyCount,
        confirmed: confirmedCount,
        preparing: preparingCount,
        ready: readyCount,
        completed: completedCount,
        cancelled: cancelledCount,
        totalGmv: Number(gmvAggregate._sum.totalAmount || 0),
      },
      orders: formattedOrders,
      pagination: {
        totalItems: totalFiltered,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(totalFiltered / currentLimit) || 1,
      },
    };
  }

  // 2. Update order status from Super Admin
  async updateOrderStatus(id: string, status: OrderStatus) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Order with ID ${id} not found.`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === OrderStatus.CONFIRMED && !existing.prepStartedAt
          ? { prepStartedAt: new Date() }
          : {}),
      },
    });

    return {
      success: true,
      message: `Order #${updated.orderNumber} status updated to ${status}`,
      order: updated,
    };
  }
}
