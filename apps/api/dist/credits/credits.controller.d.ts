import { CreditsService } from './credits.service';
import { PurchasePackDto } from './dto/purchase-pack.dto';
import { AdjustCreditsDto } from './dto/adjust-credits.dto';
export declare class CreditsController {
    private readonly creditsService;
    constructor(creditsService: CreditsService);
    getBalance(restaurantId: string, req: any): Promise<{
        restaurantId: string;
        restaurantName: string;
        creditBalance: number;
        isGraceMode: boolean;
        graceOrdersUsed: number;
        graceOrdersRemaining: number;
        isExhausted: boolean;
        isLowCredit: boolean;
    }>;
    getLedger(restaurantId: string, limit?: number, page?: number, req?: any): Promise<{
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
    createCheckout(dto: {
        restaurantId: string;
        packId: string;
        currency?: string;
    }, req: any): Promise<{
        checkoutUrl: string;
        sessionId: string;
    }>;
    verifySession(dto: {
        sessionId: string;
    }, req: any): Promise<{
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
    purchasePack(dto: PurchasePackDto, req: any): Promise<{
        checkoutUrl: string;
        sessionId: string;
    }>;
    adjustCredits(dto: AdjustCreditsDto, req: any): Promise<{
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
