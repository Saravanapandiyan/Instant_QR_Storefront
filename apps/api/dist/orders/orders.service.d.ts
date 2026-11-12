import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, UpdatePaymentSettingsDto } from './dto/order.dto';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    getOrderById(orderId: string): Promise<{
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
    getOwnerOrders(restaurantId: string, ownerUserId: string, query?: {
        status?: string;
        branchId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
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
    updateOrderStatus(orderId: string, ownerUserId: string, dto: UpdateOrderStatusDto): Promise<{
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
    updatePaymentStatus(orderId: string, ownerUserId: string, dto: UpdatePaymentStatusDto): Promise<{
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
    getPaymentSettings(restaurantId: string, ownerUserId: string): Promise<{
        restaurantId: string;
        restaurantName: string;
        enableCash: boolean;
        enableStripe: boolean;
        stripeStatus: string;
        enableTax: boolean;
        taxRate: any;
        gstNumber: any;
    }>;
    updatePaymentSettings(restaurantId: string, ownerUserId: string, dto: UpdatePaymentSettingsDto): Promise<{
        message: string;
        enableCash: any;
        enableTax: any;
        taxRate: any;
        gstNumber: any;
        enableStripe: boolean;
        stripeStatus: string;
    }>;
}
