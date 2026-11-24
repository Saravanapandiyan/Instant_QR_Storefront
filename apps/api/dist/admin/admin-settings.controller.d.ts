import { AdminSettingsService } from './admin-settings.service';
export declare class AdminSettingsController {
    private readonly settingsService;
    constructor(settingsService: AdminSettingsService);
    getPublicBranding(): Promise<import("./admin-settings.service").SiteBrandingConfig>;
    getBranding(): Promise<import("./admin-settings.service").SiteBrandingConfig>;
    updateBranding(dto: any, user: any): Promise<import("./admin-settings.service").SiteBrandingConfig>;
    uploadLogo(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    getStripeConfig(): Promise<any>;
    updateStripeConfig(dto: any, user: any): Promise<any>;
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
}
