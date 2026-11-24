"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrdersService = OrdersService_1 = class OrdersService {
    prisma;
    logger = new common_1.Logger(OrdersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrder(dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Order must contain at least one item.');
        }
        if (dto.turnstileToken) {
            const isHuman = await this.verifyTurnstile(dto.turnstileToken);
            if (!isHuman) {
                throw new common_1.BadRequestException('Human verification failed. Automated bots are not allowed.');
            }
        }
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
            throw new common_1.NotFoundException('Restaurant or branch storefront is currently not accepting orders.');
        }
        const productIds = dto.items.map((i) => i.productId);
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
            throw new common_1.BadRequestException('One or more selected dishes are no longer available.');
        }
        let subtotal = 0;
        const orderItemsData = dto.items.map((cartItem) => {
            const product = products.find((p) => p.id === cartItem.productId);
            const bp = product.branchProducts?.[0];
            if (bp && (!bp.isAvailable || !bp.isEnabled)) {
                throw new common_1.BadRequestException(`Dish "${product.name}" is currently sold out at this outlet.`);
            }
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
        const paymentConfig = branch.restaurant.paymentConfig || {};
        const enableTax = Boolean(paymentConfig.enableTax);
        const taxRate = enableTax && typeof paymentConfig.taxRate === 'number' && paymentConfig.taxRate > 0
            ? paymentConfig.taxRate
            : 0;
        const tax = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
        const totalAmount = Math.round((subtotal + tax) * 100) / 100;
        const lastOrderForRestaurant = await this.prisma.order.findFirst({
            where: { restaurantId: branch.restaurantId },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true },
        });
        const nextOrderNumber = (lastOrderForRestaurant?.orderNumber ?? 0) + 1;
        const order = await this.prisma.order.create({
            data: {
                orderNumber: nextOrderNumber,
                restaurantId: branch.restaurantId,
                branchId: branch.id,
                tableNumber: dto.tableNumber?.trim() || null,
                customerName: dto.customerName.trim(),
                customerPhone: dto.customerPhone.trim(),
                orderNotes: dto.orderNotes?.trim() || null,
                orderType: dto.orderType || client_1.OrderType.DINE_IN,
                status: client_1.OrderStatus.PENDING,
                paymentMethod: dto.paymentMethod || client_1.PaymentMethod.CASH,
                paymentStatus: client_1.PaymentStatus.PENDING,
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
    async getOrderById(orderId) {
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
            throw new common_1.NotFoundException(`Order not found.`);
        }
        return order;
    }
    async getOwnerOrders(restaurantId, ownerUserId, query) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant || restaurant.isDeleted) {
            throw new common_1.NotFoundException('Restaurant not found.');
        }
        let staffAssignedBranches = null;
        if (restaurant.ownerId !== ownerUserId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId, userId: ownerUserId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.orders?.view) {
                throw new common_1.ForbiddenException('You do not have access to view orders for this restaurant.');
            }
            const assigned = Array.isArray(staff.assignedBranches)
                ? staff.assignedBranches
                : [];
            if (!assigned.includes('ALL') && assigned.length > 0) {
                staffAssignedBranches = assigned;
            }
        }
        const baseWhere = { restaurantId };
        if (query?.branchId && query.branchId !== 'ALL') {
            if (staffAssignedBranches && !staffAssignedBranches.includes(query.branchId)) {
                throw new common_1.ForbiddenException('You do not have access to this branch.');
            }
            baseWhere.branchId = query.branchId;
        }
        else if (staffAssignedBranches) {
            baseWhere.branchId = { in: staffAssignedBranches };
        }
        if (query?.startDate || query?.endDate) {
            const dateFilter = {};
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
        const where = { ...baseWhere };
        if (query?.status && query.status !== 'ALL') {
            if (query.status === client_1.OrderStatus.PREPARING) {
                where.status = { in: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.PREPARING] };
            }
            else if (Object.values(client_1.OrderStatus).includes(query.status)) {
                where.status = query.status;
            }
        }
        const [allCount, pendingCount, preparingCount, readyCount, completedCount, cancelledCount, orders,] = await Promise.all([
            this.prisma.order.count({ where: baseWhere }),
            this.prisma.order.count({ where: { ...baseWhere, status: client_1.OrderStatus.PENDING } }),
            this.prisma.order.count({ where: { ...baseWhere, status: { in: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.PREPARING] } } }),
            this.prisma.order.count({ where: { ...baseWhere, status: client_1.OrderStatus.READY } }),
            this.prisma.order.count({ where: { ...baseWhere, status: client_1.OrderStatus.COMPLETED } }),
            this.prisma.order.count({ where: { ...baseWhere, status: client_1.OrderStatus.CANCELLED } }),
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
    async getTvBoardOrders(targetId) {
        let restaurantId = null;
        let branchId = null;
        let restaurantName = 'Kitchen';
        let branchName = 'Main Counter';
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
        }
        else {
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
            throw new common_1.NotFoundException('Branch or Restaurant not found for TV board.');
        }
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const whereClause = {
            restaurantId,
            status: { in: [client_1.OrderStatus.CONFIRMED, client_1.OrderStatus.PREPARING, client_1.OrderStatus.READY] },
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
    async updateOrderStatus(orderId, ownerUserId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurant: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        if (order.restaurant.ownerId !== ownerUserId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: order.restaurantId, userId: ownerUserId } },
            });
            const perms = staff?.permissions;
            const isAllowed = dto.status === client_1.OrderStatus.CANCELLED ? perms?.orders?.cancel : perms?.orders?.accept;
            if (!staff || !staff.isActive || !isAllowed) {
                throw new common_1.ForbiddenException('You do not have permission to manage this order.');
            }
        }
        const updateData = {
            status: dto.status,
        };
        if (dto.status === client_1.OrderStatus.CANCELLED) {
            updateData.cancelReason = dto.cancelReason || 'Cancelled by restaurant';
            updateData.cancelledAt = new Date();
        }
        else if (dto.status === client_1.OrderStatus.CONFIRMED || dto.status === client_1.OrderStatus.PREPARING) {
            const now = new Date();
            const prepMinutes = dto.prepTimeMinutes || order.prepTimeMinutes || 15;
            updateData.prepTimeMinutes = prepMinutes;
            if (!order.prepStartedAt) {
                updateData.prepStartedAt = now;
            }
            updateData.estimatedReadyAt = new Date(now.getTime() + prepMinutes * 60 * 1000);
            if (order.status === client_1.OrderStatus.PENDING || order.paymentStatus === client_1.PaymentStatus.PENDING) {
                updateData.paymentStatus = client_1.PaymentStatus.PAID;
            }
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            if ((dto.status === client_1.OrderStatus.CONFIRMED || dto.status === client_1.OrderStatus.PREPARING) &&
                order.status === client_1.OrderStatus.PENDING) {
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
                    if ((currentRest?.creditBalance ?? 0) <= -20) {
                        throw new common_1.BadRequestException(`Credit balance exhausted (-20 grace buffer orders used). Please top up credits to accept new orders.`);
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
    async updatePaymentStatus(orderId, ownerUserId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurant: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found.');
        }
        if (order.restaurant.ownerId !== ownerUserId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId: order.restaurantId, userId: ownerUserId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.orders?.collectCash) {
                throw new common_1.ForbiddenException('You do not have permission to mark payment status for this order.');
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
    async getPaymentSettings(restaurantId, ownerUserId) {
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
            throw new common_1.NotFoundException('Restaurant not found.');
        }
        if (restaurant.ownerId !== ownerUserId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId, userId: ownerUserId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.payments?.view) {
                throw new common_1.ForbiddenException('You do not have access to view payment settings.');
            }
        }
        const config = restaurant.paymentConfig || {};
        return {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            enableCash: config.enableCash !== false,
            enableStripe: false,
            stripeStatus: 'COMING_SOON',
            enableTax: Boolean(config.enableTax),
            taxRate: typeof config.taxRate === 'number' ? config.taxRate : 0,
            gstNumber: config.gstNumber || '',
        };
    }
    async updatePaymentSettings(restaurantId, ownerUserId, dto) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant || restaurant.isDeleted) {
            throw new common_1.NotFoundException('Restaurant not found.');
        }
        if (restaurant.ownerId !== ownerUserId) {
            const staff = await this.prisma.staffMember.findUnique({
                where: { restaurantId_userId: { restaurantId, userId: ownerUserId } },
            });
            const perms = staff?.permissions;
            if (!staff || !staff.isActive || !perms?.payments?.manage) {
                throw new common_1.ForbiddenException('You do not have permission to configure payment settings.');
            }
        }
        const currentConfig = restaurant.paymentConfig || {};
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
    async verifyTurnstile(token) {
        const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
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
        }
        catch (err) {
            this.logger.warn(`Turnstile check network error: ${err.message}`);
            return true;
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map