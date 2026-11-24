import { AdminOrdersService, AdminOrdersQuery, UpdateAdminOrderStatusDto } from './admin-orders.service';
export declare class AdminOrdersController {
    private readonly ordersService;
    constructor(ordersService: AdminOrdersService);
    getOrders(query: AdminOrdersQuery): Promise<{
        counts: {
            all: number;
            pending: number;
            active: number;
            confirmed: number;
            preparing: number;
            ready: number;
            completed: number;
            cancelled: number;
            totalGmv: number;
        };
        orders: {
            id: string;
            orderNumber: number;
            restaurantId: string;
            restaurantName: string;
            restaurantSlug: string;
            branchId: string;
            branchName: string;
            branchSlug: string;
            currency: string;
            tableNumber: string | null;
            customerName: string;
            customerPhone: string;
            orderNotes: string | null;
            orderType: import("@prisma/client").$Enums.OrderType;
            status: import("@prisma/client").$Enums.OrderStatus;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            subtotal: number;
            tax: number;
            totalAmount: number;
            prepTimeMinutes: number | null;
            itemsCount: number;
            items: {
                id: string;
                name: string;
                imageUrl: string | null;
                quantity: number;
                unitPrice: number;
                totalPrice: number;
                itemNotes: string | null;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            totalItems: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateOrderStatus(id: string, body: UpdateAdminOrderStatusDto): Promise<{
        success: boolean;
        message: string;
        order: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            restaurantId: string;
            tableNumber: string | null;
            branchId: string;
            orderNumber: number;
            customerName: string;
            customerPhone: string;
            orderNotes: string | null;
            orderType: import("@prisma/client").$Enums.OrderType;
            status: import("@prisma/client").$Enums.OrderStatus;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            prepTimeMinutes: number | null;
            prepStartedAt: Date | null;
            estimatedReadyAt: Date | null;
            cancelReason: string | null;
            cancelledAt: Date | null;
        };
    }>;
}
