import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
export interface SiteBrandingConfig {
    siteTitle: string;
    siteTagline: string;
    supportEmail: string;
    defaultCurrency: string;
    lightLogoUrl: string | null;
    darkLogoUrl: string | null;
    faviconUrl: string | null;
    poweredByText: string;
    poweredByLink: string;
    showPoweredByBadge: boolean;
    customFooterNote: string;
}
export declare const DEFAULT_BRANDING: SiteBrandingConfig;
export interface StripeConfig {
    mode: 'test' | 'live';
    testPublishableKey: string;
    testSecretKey: string;
    testWebhookSecret: string;
    livePublishableKey: string;
    liveSecretKey: string;
    liveWebhookSecret: string;
    defaultCurrency: string;
    platformFeePercentage: number;
    isActive: boolean;
}
export declare const DEFAULT_STRIPE_CONFIG: StripeConfig;
export declare class AdminSettingsService {
    private readonly prisma;
    private readonly storageService;
    constructor(prisma: PrismaService, storageService: StorageService);
    uploadLogo(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    getPublicBranding(): Promise<SiteBrandingConfig>;
    getBranding(): Promise<SiteBrandingConfig>;
    updateBranding(dto: Partial<SiteBrandingConfig>, userId: string): Promise<SiteBrandingConfig>;
    getStripeConfig(): Promise<any>;
    updateStripeConfig(dto: Partial<StripeConfig>, userId: string): Promise<any>;
    testStripeConnection(): Promise<{
        success: boolean;
        mode: "test" | "live";
        message: string;
        currency: any;
    } | {
        success: boolean;
        mode: "test" | "live";
        message: any;
        currency?: undefined;
    }>;
    private maskKey;
}
