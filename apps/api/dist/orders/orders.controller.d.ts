import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, UpdatePaymentSettingsDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(dto: CreateOrderDto): Promise<{
        message: string;
        order: {
            restaurant: {
                name: string;
                slug: string;
                defaultCurrency: string;
                id: string;
            };
            branch: {
                name: string;
                slug: string;
                id: string;
                currency: string;
            };
            items: ({
                product: {
                    name: string;
                    id: string;
                    imageUrl: string | null;
                };
            } & {
                id: string;
                productId: string;
                quantity: number;
                notes: string | null;
                productName: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            restaurantId: string;
            branchId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            customerName: string;
            customerPhone: string;
            tableNumber: string | null;
            orderType: import("@prisma/client").$Enums.OrderType;
            orderNotes: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            cancelReason: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            orderNumber: number;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            cancelledAt: Date | null;
        };
    }>;
    getOrderById(id: string): Promise<{
        restaurant: {
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            id: string;
        };
        branch: {
            name: string;
            slug: string;
            id: string;
            address: string | null;
            phone: string | null;
            currency: string;
        };
        items: ({
            product: {
                name: string;
                id: string;
                imageUrl: string | null;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            notes: string | null;
            productName: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        restaurantId: string;
        branchId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        customerName: string;
        customerPhone: string;
        tableNumber: string | null;
        orderType: import("@prisma/client").$Enums.OrderType;
        orderNotes: string | null;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        cancelReason: string | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderNumber: number;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        cancelledAt: Date | null;
    }>;
    getOwnerOrders(restaurantId: string, user: any, status?: string, branchId?: string, startDate?: string, endDate?: string): Promise<{
        counts: {
            all: number;
            pending: number;
            preparing: number;
            ready: number;
            completed: number;
            cancelled: number;
        };
        orders: ({
            branch: {
                name: string;
                slug: string;
                id: string;
            };
            items: ({
                product: {
                    name: string;
                    id: string;
                    imageUrl: string | null;
                };
            } & {
                id: string;
                productId: string;
                quantity: number;
                notes: string | null;
                productName: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            restaurantId: string;
            branchId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            customerName: string;
            customerPhone: string;
            tableNumber: string | null;
            orderType: import("@prisma/client").$Enums.OrderType;
            orderNotes: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            cancelReason: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            orderNumber: number;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            cancelledAt: Date | null;
        })[];
    }>;
    updateOrderStatus(id: string, user: any, dto: UpdateOrderStatusDto): Promise<{
        message: string;
        order: {
            branch: {
                name: string;
                id: string;
            };
            items: ({
                product: {
                    name: string;
                    id: string;
                    imageUrl: string | null;
                };
            } & {
                id: string;
                productId: string;
                quantity: number;
                notes: string | null;
                productName: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            restaurantId: string;
            branchId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            customerName: string;
            customerPhone: string;
            tableNumber: string | null;
            orderType: import("@prisma/client").$Enums.OrderType;
            orderNotes: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            cancelReason: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            orderNumber: number;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            cancelledAt: Date | null;
        };
    }>;
    updatePaymentStatus(id: string, user: any, dto: UpdatePaymentStatusDto): Promise<{
        message: string;
        order: {
            branch: {
                name: string;
                id: string;
            };
            items: ({
                product: {
                    name: string;
                    id: string;
                    imageUrl: string | null;
                };
            } & {
                id: string;
                productId: string;
                quantity: number;
                notes: string | null;
                productName: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            restaurantId: string;
            branchId: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            customerName: string;
            customerPhone: string;
            tableNumber: string | null;
            orderType: import("@prisma/client").$Enums.OrderType;
            orderNotes: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            cancelReason: string | null;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            orderNumber: number;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            cancelledAt: Date | null;
        };
    }>;
    getPaymentSettings(restaurantId: string, user: any): Promise<{
        restaurantId: string;
        restaurantName: string;
        enableCash: boolean;
        enableStripe: boolean;
        stripeStatus: string;
        enableTax: boolean;
        taxRate: any;
        gstNumber: any;
    }>;
    updatePaymentSettings(restaurantId: string, user: any, dto: UpdatePaymentSettingsDto): Promise<{
        message: string;
        enableCash: any;
        enableTax: any;
        taxRate: any;
        gstNumber: any;
        enableStripe: boolean;
        stripeStatus: string;
    }>;
}
