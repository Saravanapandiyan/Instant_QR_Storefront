export declare class PurchasePackDto {
    restaurantId: string;
    packId: string;
    paymentMethod: 'STRIPE' | 'RAZORPAY' | 'MOCK_CARD';
    idempotencyKey?: string;
}
