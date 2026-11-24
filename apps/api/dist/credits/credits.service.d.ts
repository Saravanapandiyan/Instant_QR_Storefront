import { PrismaService } from '../prisma/prisma.service';
import { PurchasePackDto } from './dto/purchase-pack.dto';
import { AdjustCreditsDto } from './dto/adjust-credits.dto';
export declare class CreditsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private verifyRestaurantAccess;
    getBalance(restaurantId: string, userId: string): Promise<{
        restaurantId: string;
        restaurantName: string;
        creditBalance: number;
        isGraceMode: boolean;
        graceOrdersUsed: number;
        graceOrdersRemaining: number;
        isExhausted: boolean;
        isLowCredit: boolean;
    }>;
    getLedger(restaurantId: string, userId: string, limit?: number, page?: number): Promise<{
        entries: {
            id: string;
            createdAt: Date;
            restaurantId: string;
            delta: number;
            reason: string;
            refId: string | null;
            balanceAfter: number;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    private getStripeClient;
    createStripeCheckoutSession(dto: {
        restaurantId: string;
        packId: string;
        currency?: string;
    }, userId: string, rawOrigin?: string): Promise<{
        checkoutUrl: string;
        sessionId: string;
    }>;
    verifyAndFulfillStripeSession(sessionId: string, userId: string): Promise<{
        success: boolean;
        message: string;
        packName: string;
        creditsAdded: number;
        newBalance: number;
        paymentMethod: string;
        invoiceRef: string | null;
        isDuplicate: boolean;
        createdAt?: undefined;
    } | {
        success: boolean;
        message: string;
        packName: string;
        creditsAdded: number;
        newBalance: number;
        paymentMethod: string;
        invoiceRef: string | null;
        createdAt: Date;
        isDuplicate?: undefined;
    }>;
    purchasePack(dto: PurchasePackDto, userId: string, rawOrigin?: string): Promise<{
        checkoutUrl: string;
        sessionId: string;
    }>;
    adjustCredits(dto: AdjustCreditsDto, adminUserId: string): Promise<{
        success: boolean;
        message: string;
        newBalance: number;
        entry: {
            id: string;
            createdAt: Date;
            restaurantId: string;
            delta: number;
            reason: string;
            refId: string | null;
            balanceAfter: number;
        };
    }>;
}
