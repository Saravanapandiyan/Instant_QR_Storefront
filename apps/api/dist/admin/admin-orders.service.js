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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrdersService = exports.UpdateAdminOrderStatusDto = exports.AdminOrdersQuery = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
class AdminOrdersQuery {
    restaurantId;
    branchId;
    status;
    search;
    startDate;
    endDate;
    page;
    limit;
}
exports.AdminOrdersQuery = AdminOrdersQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminOrdersQuery.prototype, "restaurantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminOrdersQuery.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminOrdersQuery.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminOrdersQuery.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminOrdersQuery.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminOrdersQuery.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdminOrdersQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdminOrdersQuery.prototype, "limit", void 0);
class UpdateAdminOrderStatusDto {
    status;
}
exports.UpdateAdminOrderStatusDto = UpdateAdminOrderStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminOrderStatusDto.prototype, "status", void 0);
let AdminOrdersService = class AdminOrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrders(query) {
        const { restaurantId, branchId, status, search, startDate, endDate, page, limit = 50 } = query;
        const where = {};
        if (restaurantId && restaurantId !== 'ALL') {
            where.restaurantId = restaurantId;
        }
        if (branchId && branchId !== 'ALL') {
            where.branchId = branchId;
        }
        if (status && status !== 'ALL') {
            where.status = status;
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
        const scopeWhere = {};
        if (restaurantId && restaurantId !== 'ALL') {
            scopeWhere.restaurantId = restaurantId;
        }
        if (branchId && branchId !== 'ALL') {
            scopeWhere.branchId = branchId;
        }
        const currentPage = page && page > 0 ? Number(page) : 1;
        const currentLimit = limit && limit > 0 ? Math.min(Number(limit), 200) : 50;
        const skip = (currentPage - 1) * currentLimit;
        const [orders, totalCount, pendingCount, confirmedCount, preparingCount, readyCount, completedCount, cancelledCount, gmvAggregate, totalFiltered,] = await Promise.all([
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
            this.prisma.order.count({ where: { ...scopeWhere, status: client_1.OrderStatus.PENDING } }),
            this.prisma.order.count({ where: { ...scopeWhere, status: client_1.OrderStatus.CONFIRMED } }),
            this.prisma.order.count({ where: { ...scopeWhere, status: client_1.OrderStatus.PREPARING } }),
            this.prisma.order.count({ where: { ...scopeWhere, status: client_1.OrderStatus.READY } }),
            this.prisma.order.count({ where: { ...scopeWhere, status: client_1.OrderStatus.COMPLETED } }),
            this.prisma.order.count({ where: { ...scopeWhere, status: client_1.OrderStatus.CANCELLED } }),
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
    async updateOrderStatus(id, status) {
        const existing = await this.prisma.order.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Order with ID ${id} not found.`);
        }
        const updated = await this.prisma.order.update({
            where: { id },
            data: {
                status,
                ...(status === client_1.OrderStatus.CONFIRMED && !existing.prepStartedAt
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
};
exports.AdminOrdersService = AdminOrdersService;
exports.AdminOrdersService = AdminOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminOrdersService);
//# sourceMappingURL=admin-orders.service.js.map