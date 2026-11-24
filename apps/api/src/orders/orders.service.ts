import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  UpdatePaymentSettingsDto,
} from './dto/order.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, OrderType } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Customer: Place new order with Cash
  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // Verify Cloudflare Turnstile invisible CAPTCHA to stop bot orders
    if (dto.turnstileToken) {
      const isHuman = await this.verifyTurnstile(dto.turnstileToken);
      if (!isHuman) {
        throw new BadRequestException('Human verification failed. Automated bots are not allowed.');
      }
    }

    // Resolve branch & restaurant
    const branch = await this.prisma.branch.findFirst({
      where: {
        slug: dto.branchSlug,
        isActive: true,
        isDeleted: false,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            defaultCurrency: true,
            paymentConfig: true,
          },
        },
      },
    });

    if (!branch || !branch.restaurant || !branch.restaurant.isActive) {
      throw new NotFoundException('Restaurant or branch storefront is currently not accepting orders.');
    }

    // Extract product IDs
    const productIds = dto.items.map((i) => i.productId);

    // Fetch products
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        restaurantId: branch.restaurantId,
        isDeleted: false,
      },
      include: {
        branchProducts: {
          where: { branchId: branch.id },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more selected dishes are no longer available.');
    }

    // Map and calculate pricing
    let subtotal = 0;
    const orderItemsData = dto.items.map((cartItem) => {
      const product = products.find((p) => p.id === cartItem.productId)!;
      const bp = product.branchProducts?.[0];

      // Check branch-specific availability
      if (bp && (!bp.isAvailable || !bp.isEnabled)) {
        throw new BadRequestException(`Dish "${product.name}" is currently sold out at this outlet.`);
      }

      // Determine price (override or base)
      const unitPrice = bp?.priceOverride ? Number(bp.priceOverride) : Number(product.basePrice);
      const totalPrice = unitPrice * cartItem.quantity;
      subtotal += totalPrice;

      return {
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice,
        totalPrice,
        notes: cartItem.notes || null,
      };
    });

    // Calculate taxes based on restaurant paymentConfig (defaults to 0% / inclusive unless explicitly configured)
    const paymentConfig = (branch.restaurant.paymentConfig as any) || {};
    const enableTax = Boolean(paymentConfig.enableTax);
    const taxRate = enableTax && typeof paymentConfig.taxRate === 'number' && paymentConfig.taxRate > 0
      ? paymentConfig.taxRate
      : 0;

    const tax = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    // Calculate next orderNumber scoped per restaurant
    const lastOrderForRestaurant = await this.prisma.order.findFirst({
      where: { restaurantId: branch.restaurantId },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const nextOrderNumber = (lastOrderForRestaurant?.orderNumber ?? 0) + 1;

    // Create Order with nested items
    const order = await this.prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        restaurantId: branch.restaurantId,
        branchId: branch.id,
        tableNumber: dto.tableNumber?.trim() || null,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        orderNotes: dto.orderNotes?.trim() || null,
        orderType: dto.orderType || OrderType.DINE_IN,
        status: OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        tax,
        totalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            address: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            defaultCurrency: true,
            themeConfig: true,
          },
        },
      },
    });

    return {
      message: 'Order placed successfully. Please proceed with payment at the counter.',
      order,
    };
  }

  // 2. Customer: Get order details by ID for live order tracking
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            address: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            defaultCurrency: true,
            themeConfig: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order not found.`);
    }

    return order;
  }

  // 3. Owner/Staff: Get orders for restaurant with filters
  async getOwnerOrders(
    restaurantId: string,
    ownerUserId: string,
    query?: { status?: string; branchId?: string; startDate?: string; endDate?: string },
  ) {
    // Verify ownership or staff permissions
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || restaurant.isDeleted) {
      throw new NotFoundException('Restaurant not found.');
    }

    let staffAssignedBranches: string[] | null = null;

    if (restaurant.ownerId !== ownerUserId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId, userId: ownerUserId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.orders?.view) {
        throw new ForbiddenException('You do not have access to view orders for this restaurant.');
      }
      const assigned = Array.isArray(staff.assignedBranches)
        ? (staff.assignedBranches as string[])
        : [];
      if (!assigned.includes('ALL') && assigned.length > 0) {
        staffAssignedBranches = assigned;
      }
    }

    const baseWhere: any = { restaurantId };

    if (query?.branchId && query.branchId !== 'ALL') {
      if (staffAssignedBranches && !staffAssignedBranches.includes(query.branchId)) {
        throw new ForbiddenException('You do not have access to this branch.');
      }
      baseWhere.branchId = query.branchId;
    } else if (staffAssignedBranches) {
      baseWhere.branchId = { in: staffAssignedBranches };
    }

    if (query?.startDate || query?.endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (query.startDate) {
        const parsedStart = new Date(query.startDate);
        if (!Number.isNaN(parsedStart.getTime())) {
          dateFilter.gte = parsedStart;
        }
      }
      if (query.endDate) {
        const parsedEnd = new Date(query.endDate);
        if (!Number.isNaN(parsedEnd.getTime())) {
          dateFilter.lte = parsedEnd;
        }
      }
      if (dateFilter.gte || dateFilter.lte) {
        baseWhere.createdAt = dateFilter;
      }
    }

    const where: any = { ...baseWhere };

    if (query?.status && query.status !== 'ALL') {
      if (query.status === OrderStatus.PREPARING) {
        where.status = { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] };
      } else if (Object.values(OrderStatus).includes(query.status as OrderStatus)) {
        where.status = query.status as OrderStatus;
      }
    }

    // Counts for tabs
    const [
      allCount,
      pendingCount,
      preparingCount,
      readyCount,
      completedCount,
      cancelledCount,
      orders,
    ] = await Promise.all([
      this.prisma.order.count({ where: baseWhere }),
      this.prisma.order.count({ where: { ...baseWhere, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...baseWhere, status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] } } }),
      this.prisma.order.count({ where: { ...baseWhere, status: OrderStatus.READY } }),
      this.prisma.order.count({ where: { ...baseWhere, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...baseWhere, status: OrderStatus.CANCELLED } }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      counts: {
        all: allCount,
        pending: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      orders,
    };
  }

  // 3.1 Public TV Ready Board (Wall displays / pickup TV)
  async getTvBoardOrders(targetId: string) {
    let restaurantId: string | null = null;
    let branchId: string | null = null;
    let restaurantName = 'Kitchen';
    let branchName = 'Main Counter';

    // 1. Try finding as Branch
    const branch = await this.prisma.branch.findFirst({
      where: {
        OR: [{ id: targetId }, { slug: targetId }],
        isDeleted: false,
      },
      include: {
        restaurant: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    if (branch) {
      restaurantId = branch.restaurantId;
      branchId = branch.id;
      restaurantName = branch.restaurant?.name || 'Restaurant';
      branchName = branch.name;
    } else {
      // 2. Try finding as Restaurant directly
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: targetId },
        select: { id: true, name: true, slug: true, logoUrl: true },
      });
      if (restaurant) {
        restaurantId = restaurant.id;
        restaurantName = restaurant.name;
      }
    }

    if (!restaurantId) {
      throw new NotFoundException('Branch or Restaurant not found for TV board.');
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const whereClause: any = {
      restaurantId,
      status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
      createdAt: { gte: twelveHoursAgo },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        tableNumber: true,
        customerName: true,
        status: true,
        prepTimeMinutes: true,
        prepStartedAt: true,
        estimatedReadyAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return {
      restaurantName,
      branchName,
      restaurantId,
      branchId,
      orders,
    };
  }

  // 4. Owner: Update order status (Accept, Prep, Ready, Complete, Cancel)
  async updateOrderStatus(
    orderId: string,
    ownerUserId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.restaurant.ownerId !== ownerUserId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: order.restaurantId, userId: ownerUserId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      const isAllowed =
        dto.status === OrderStatus.CANCELLED ? perms?.orders?.cancel : perms?.orders?.accept;
      if (!staff || !staff.isActive || !isAllowed) {
        throw new ForbiddenException('You do not have permission to manage this order.');
      }
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === OrderStatus.CANCELLED) {
      updateData.cancelReason = dto.cancelReason || 'Cancelled by restaurant';
      updateData.cancelledAt = new Date();
    } else if (dto.status === OrderStatus.CONFIRMED || dto.status === OrderStatus.PREPARING) {
      const now = new Date();
      const prepMinutes = dto.prepTimeMinutes || order.prepTimeMinutes || 15;
      updateData.prepTimeMinutes = prepMinutes;
      if (!order.prepStartedAt) {
        updateData.prepStartedAt = now;
      }
      updateData.estimatedReadyAt = new Date(now.getTime() + prepMinutes * 60 * 1000);
      // Auto-mark payment as PAID when staff accepts/confirms order at counter
      if (order.status === OrderStatus.PENDING || order.paymentStatus === PaymentStatus.PENDING) {
        updateData.paymentStatus = PaymentStatus.PAID;
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atomic 1-Credit Deduction on Order Acceptance / Kitchen Prep
      if (
        (dto.status === OrderStatus.CONFIRMED || dto.status === OrderStatus.PREPARING) &&
        order.status === OrderStatus.PENDING
      ) {
        const existingDebit = await tx.creditLedger.findFirst({
          where: {
            restaurantId: order.restaurantId,
            refId: order.id,
            reason: 'ORDER_CONFIRMED',
          },
        });

        if (!existingDebit) {
          const currentRest = await tx.restaurant.findUnique({
            where: { id: order.restaurantId },
            select: { creditBalance: true, name: true },
          });

          // Grace buffer rule: Up to 20 orders allowed after balance hits 0 (balance down to -20)
          if ((currentRest?.creditBalance ?? 0) <= -20) {
            throw new BadRequestException(
              `Credit balance exhausted (-20 grace buffer orders used). Please top up credits to accept new orders.`,
            );
          }

          const rest = await tx.restaurant.update({
            where: { id: order.restaurantId },
            data: {
              creditBalance: {
                decrement: 1,
              },
            },
            select: { creditBalance: true },
          });

          await tx.creditLedger.create({
            data: {
              restaurantId: order.restaurantId,
              delta: -1,
              reason: 'ORDER_CONFIRMED',
              refId: order.id,
              balanceAfter: rest.creditBalance,
            },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              slug: true,
              currency: true,
              address: true,
              phone: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              defaultCurrency: true,
              creditBalance: true,
            },
          },
        },
      });
    });

    return {
      message: `Order #${updated.orderNumber} status updated to ${dto.status}.`,
      order: updated,
    };
  }

  // 5. Owner: Update payment status (Mark Cash Paid)
  async updatePaymentStatus(
    orderId: string,
    ownerUserId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.restaurant.ownerId !== ownerUserId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId: order.restaurantId, userId: ownerUserId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.orders?.collectCash) {
        throw new ForbiddenException('You do not have permission to mark payment status for this order.');
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: dto.paymentStatus,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        branch: { select: { id: true, name: true } },
      },
    });

    return {
      message: `Payment status for Order #${updated.orderNumber} updated to ${dto.paymentStatus}.`,
      order: updated,
    };
  }

  // 6. Owner/Staff: Get payment settings for restaurant
  async getPaymentSettings(restaurantId: string, ownerUserId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        paymentConfig: true,
        isDeleted: true,
      },
    });

    if (!restaurant || restaurant.isDeleted) {
      throw new NotFoundException('Restaurant not found.');
    }

    if (restaurant.ownerId !== ownerUserId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId, userId: ownerUserId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.payments?.view) {
        throw new ForbiddenException('You do not have access to view payment settings.');
      }
    }

    const config = (restaurant.paymentConfig as any) || {};

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      enableCash: config.enableCash !== false, // default true
      enableStripe: false, // disabled as requested
      stripeStatus: 'COMING_SOON',
      enableTax: Boolean(config.enableTax),
      taxRate: typeof config.taxRate === 'number' ? config.taxRate : 0,
      gstNumber: config.gstNumber || '',
    };
  }

  // 7. Owner/Staff: Update payment and tax settings
  async updatePaymentSettings(
    restaurantId: string,
    ownerUserId: string,
    dto: UpdatePaymentSettingsDto,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || restaurant.isDeleted) {
      throw new NotFoundException('Restaurant not found.');
    }

    if (restaurant.ownerId !== ownerUserId) {
      const staff = await this.prisma.staffMember.findUnique({
        where: { restaurantId_userId: { restaurantId, userId: ownerUserId } },
      });
      const perms = staff?.permissions as Record<string, any>;
      if (!staff || !staff.isActive || !perms?.payments?.manage) {
        throw new ForbiddenException('You do not have permission to configure payment settings.');
      }
    }

    const currentConfig = (restaurant.paymentConfig as any) || {};
    const newConfig = {
      ...currentConfig,
      enableCash: dto.enableCash,
      enableTax: Boolean(dto.enableTax),
      taxRate: Number(dto.taxRate || 0),
      gstNumber: dto.gstNumber?.trim() || '',
      enableStripe: false,
    };

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { paymentConfig: newConfig },
    });

    return {
      message: 'Payment and tax settings saved successfully.',
      enableCash: newConfig.enableCash,
      enableTax: newConfig.enableTax,
      taxRate: newConfig.taxRate,
      gstNumber: newConfig.gstNumber,
      enableStripe: false,
      stripeStatus: 'COMING_SOON',
    };
  }

  // Cloudflare Turnstile token verification helper
  private async verifyTurnstile(token: string): Promise<boolean> {
    const secretKey =
      process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; // Cloudflare official testing secret
    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err: any) {
      this.logger.warn(`Turnstile check network error: ${err.message}`);
      return true; // Fail open on network errors so genuine diners are not blocked
    }
  }
}
