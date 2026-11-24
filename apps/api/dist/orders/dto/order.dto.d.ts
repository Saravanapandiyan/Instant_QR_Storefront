import { OrderType, PaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client';
export declare class OrderItemDto {
    productId: string;
    quantity: number;
    notes?: string;
}
export declare class CreateOrderDto {
    branchSlug: string;
    customerName: string;
    customerPhone: string;
    tableNumber?: string;
    orderType?: OrderType;
    orderNotes?: string;
    paymentMethod?: PaymentMethod;
    turnstileToken?: string;
    items: OrderItemDto[];
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    cancelReason?: string;
    prepTimeMinutes?: number;
}
export declare class UpdatePaymentStatusDto {
    paymentStatus: PaymentStatus;
}
export declare class UpdatePaymentSettingsDto {
    enableCash: boolean;
    enableUpi?: boolean;
    upiId?: string;
    upiName?: string;
    enableTax?: boolean;
    taxRate?: number;
    gstNumber?: string;
}
