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
    items: OrderItemDto[];
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    cancelReason?: string;
}
export declare class UpdatePaymentStatusDto {
    paymentStatus: PaymentStatus;
}
export declare class UpdatePaymentSettingsDto {
    enableCash: boolean;
    enableTax?: boolean;
    taxRate?: number;
    gstNumber?: string;
}
