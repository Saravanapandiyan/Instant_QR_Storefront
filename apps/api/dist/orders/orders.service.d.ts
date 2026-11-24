import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, UpdatePaymentSettingsDto } from './dto/order.dto';
export declare class OrdersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrder(dto: CreateOrderDto): Promise<{
        message: string;
        order: {
            restaurant: {
                name: string;
                slug: string;
                defaultCurrency: string;
                themeConfig: import("@prisma/client/runtime/library").JsonValue;
                id: string;
                paymentConfig: import("@prisma/client/runtime/library").JsonValue;
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
                orderId: string;
                productId: string;
                productName: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                notes: string | null;
            })[];
        } & {
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
    getOrderById(orderId: string): Promise<{
        restaurant: {
            name: string;
            slug: string;
            logoUrl: string | null;
            defaultCurrency: string;
            themeConfig: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            paymentConfig: import("@prisma/client/runtime/library").JsonValue;
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
            orderId: string;
            productId: string;
            productName: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
        })[];
    } & {
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
                orderId: string;
                productId: string;
                productName: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                notes: string | null;
            })[];
        } & {
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
        })[];
    }>;
    getTvBoardOrders(targetId: string): Promise<{
        restaurantName: string;
        branchName: string;
        restaurantId: string;
        branchId: string | null;
        orders: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tableNumber: string | null;
            orderNumber: number;
            customerName: string;
            orderType: import("@prisma/client").$Enums.OrderType;
            status: import("@prisma/client").$Enums.OrderStatus;
            prepTimeMinutes: number | null;
            prepStartedAt: Date | null;
            estimatedReadyAt: Date | null;
        }[];
    }>;
    updateOrderStatus(orderId: string, ownerUserId: string, dto: UpdateOrderStatusDto): Promise<{
        message: string;
        order: {
            restaurant: {
                name: string;
                slug: string;
                logoUrl: string | null;
                defaultCurrency: string;
                id: string;
                creditBalance: number;
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
                orderId: string;
                productId: string;
                productName: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                notes: string | null;
            })[];
        } & {
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
                orderId: string;
                productId: string;
                productName: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                notes: string | null;
            })[];
        } & {
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
    getPaymentSettings(restaurantId: string, ownerUserId: string): Promise<{
        restaurantId: string;
        restaurantName: string;
        enableCash: boolean;
        enableUpi: boolean;
        upiId: any;
        upiName: any;
        enableTax: boolean;
        taxRate: any;
        gstNumber: any;
    }>;
    updatePaymentSettings(restaurantId: string, ownerUserId: string, dto: UpdatePaymentSettingsDto): Promise<{
        message: string;
        enableCash: any;
        enableUpi: any;
        upiId: any;
        upiName: any;
        enableTax: any;
        taxRate: any;
        gstNumber: any;
    }>;
    private verifyTurnstile;
}
