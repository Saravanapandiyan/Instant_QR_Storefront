"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSettingsService = exports.DEFAULT_STRIPE_CONFIG = exports.DEFAULT_BRANDING = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../common/storage/storage.service");
exports.DEFAULT_BRANDING = {
    siteTitle: 'InstaDine',
    siteTagline: 'Turn every table into a storefront.',
    supportEmail: 'support@instadine.com',
    lightLogoUrl: null,
    darkLogoUrl: null,
    faviconUrl: null,
    poweredByText: 'Powered by InstaDine',
    poweredByLink: '/register',
    showPoweredByBadge: true,
    customFooterNote: 'Multi-restaurant touchless QR storefront platform.',
};
exports.DEFAULT_STRIPE_CONFIG = {
    mode: 'test',
    testPublishableKey: '',
    testSecretKey: '',
    testWebhookSecret: '',
    livePublishableKey: '',
    liveSecretKey: '',
    liveWebhookSecret: '',
    defaultCurrency: 'INR',
    platformFeePercentage: 0,
    isActive: false,
};
let AdminSettingsService = class AdminSettingsService {
    prisma;
    storageService;
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    async uploadLogo(file) {
        if (!file) {
            throw new common_1.BadRequestException('No image file provided for upload');
        }
        const relativeKey = await this.storageService.uploadFile(file, 'branding');
        const url = relativeKey.startsWith('/') ? relativeKey : `/uploads/${relativeKey}`;
        return { url };
    }
    async getPublicBranding() {
        try {
            const setting = await this.prisma.platformSetting.findUnique({
                where: { key: 'SITE_BRANDING' },
            });
            if (!setting || !setting.value) {
                return exports.DEFAULT_BRANDING;
            }
            return {
                ...exports.DEFAULT_BRANDING,
                ...setting.value,
            };
        }
        catch {
            return exports.DEFAULT_BRANDING;
        }
    }
    async getBranding() {
        return this.getPublicBranding();
    }
    async updateBranding(dto, userId) {
        const current = await this.getPublicBranding();
        const updated = {
            ...current,
            ...dto,
        };
        await this.prisma.platformSetting.upsert({
            where: { key: 'SITE_BRANDING' },
            create: {
                key: 'SITE_BRANDING',
                value: updated,
                description: 'Global site title, brand logos, and footer configuration',
                isSecret: false,
                updatedBy: userId,
            },
            update: {
                value: updated,
                updatedBy: userId,
            },
        });
        return updated;
    }
    async getStripeConfig() {
        try {
            const setting = await this.prisma.platformSetting.findUnique({
                where: { key: 'STRIPE_CONFIG' },
            });
            const raw = setting?.value
                ? { ...exports.DEFAULT_STRIPE_CONFIG, ...setting.value }
                : exports.DEFAULT_STRIPE_CONFIG;
            return {
                ...raw,
                testSecretKey: raw.testSecretKey ? this.maskKey(raw.testSecretKey) : '',
                testWebhookSecret: raw.testWebhookSecret ? this.maskKey(raw.testWebhookSecret) : '',
                liveSecretKey: raw.liveSecretKey ? this.maskKey(raw.liveSecretKey) : '',
                liveWebhookSecret: raw.liveWebhookSecret ? this.maskKey(raw.liveWebhookSecret) : '',
                hasTestSecretKey: Boolean(raw.testSecretKey),
                hasLiveSecretKey: Boolean(raw.liveSecretKey),
            };
        }
        catch {
            return exports.DEFAULT_STRIPE_CONFIG;
        }
    }
    async updateStripeConfig(dto, userId) {
        const existing = await this.prisma.platformSetting.findUnique({
            where: { key: 'STRIPE_CONFIG' },
        });
        const currentRaw = existing?.value
            ? { ...exports.DEFAULT_STRIPE_CONFIG, ...existing.value }
            : exports.DEFAULT_STRIPE_CONFIG;
        const updatedRaw = {
            ...currentRaw,
            ...dto,
            testSecretKey: dto.testSecretKey && !dto.testSecretKey.includes('•••')
                ? dto.testSecretKey.trim()
                : currentRaw.testSecretKey,
            testWebhookSecret: dto.testWebhookSecret && !dto.testWebhookSecret.includes('•••')
                ? dto.testWebhookSecret.trim()
                : currentRaw.testWebhookSecret,
            liveSecretKey: dto.liveSecretKey && !dto.liveSecretKey.includes('•••')
                ? dto.liveSecretKey.trim()
                : currentRaw.liveSecretKey,
            liveWebhookSecret: dto.liveWebhookSecret && !dto.liveWebhookSecret.includes('•••')
                ? dto.liveWebhookSecret.trim()
                : currentRaw.liveWebhookSecret,
        };
        await this.prisma.platformSetting.upsert({
            where: { key: 'STRIPE_CONFIG' },
            create: {
                key: 'STRIPE_CONFIG',
                value: updatedRaw,
                description: 'Global Stripe payment gateway credentials and mode',
                isSecret: true,
                updatedBy: userId,
            },
            update: {
                value: updatedRaw,
                updatedBy: userId,
            },
        });
        return this.getStripeConfig();
    }
    async testStripeConnection() {
        const setting = await this.prisma.platformSetting.findUnique({
            where: { key: 'STRIPE_CONFIG' },
        });
        const config = setting?.value
            ? { ...exports.DEFAULT_STRIPE_CONFIG, ...setting.value }
            : exports.DEFAULT_STRIPE_CONFIG;
        const activeSecretKey = config.mode === 'live' ? config.liveSecretKey : config.testSecretKey;
        if (!activeSecretKey) {
            return {
                success: false,
                mode: config.mode,
                message: `No ${config.mode.toUpperCase()} Stripe Secret Key configured. Please enter a valid Secret Key.`,
            };
        }
        try {
            const Stripe = require('stripe');
            const stripeClient = new Stripe(activeSecretKey, { apiVersion: '2023-10-16' });
            const balance = await stripeClient.balance.retrieve();
            return {
                success: true,
                mode: config.mode,
                message: `Successfully connected to Stripe API in ${config.mode.toUpperCase()} mode!`,
                currency: balance.available?.[0]?.currency?.toUpperCase() || config.defaultCurrency,
            };
        }
        catch (err) {
            return {
                success: false,
                mode: config.mode,
                message: err.message || 'Failed to authenticate with Stripe. Check your Secret Key.',
            };
        }
    }
    maskKey(key) {
        if (!key || key.length < 8)
            return '••••••••';
        const prefix = key.slice(0, 7);
        const suffix = key.slice(-4);
        return `${prefix}••••••••${suffix}`;
    }
};
exports.AdminSettingsService = AdminSettingsService;
exports.AdminSettingsService = AdminSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], AdminSettingsService);
//# sourceMappingURL=admin-settings.service.js.map