import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';

export interface SiteBrandingConfig {
  siteTitle: string;
  siteTagline: string;
  supportEmail: string;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  poweredByText: string;
  poweredByLink: string;
  showPoweredByBadge: boolean;
  customFooterNote: string;
}

export const DEFAULT_BRANDING: SiteBrandingConfig = {
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

export const DEFAULT_STRIPE_CONFIG: StripeConfig = {
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

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // 0. Super Admin: Upload branding logo or favicon
  async uploadLogo(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided for upload');
    }
    const relativeKey = await this.storageService.uploadFile(file, 'branding');
    const url = relativeKey.startsWith('/') ? relativeKey : `/uploads/${relativeKey}`;
    return { url };
  }

  // 1. Public branding configuration (consumed by customer storefront & owner portal)
  async getPublicBranding(): Promise<SiteBrandingConfig> {
    try {
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key: 'SITE_BRANDING' },
      });

      if (!setting || !setting.value) {
        return DEFAULT_BRANDING;
      }

      return {
        ...DEFAULT_BRANDING,
        ...(setting.value as Record<string, any>),
      };
    } catch {
      return DEFAULT_BRANDING;
    }
  }

  // 2. Admin: Get full branding settings
  async getBranding(): Promise<SiteBrandingConfig> {
    return this.getPublicBranding();
  }

  // 3. Admin: Update branding settings
  async updateBranding(dto: Partial<SiteBrandingConfig>, userId: string): Promise<SiteBrandingConfig> {
    const current = await this.getPublicBranding();
    const updated = {
      ...current,
      ...dto,
    };

    await this.prisma.platformSetting.upsert({
      where: { key: 'SITE_BRANDING' },
      create: {
        key: 'SITE_BRANDING',
        value: updated as any,
        description: 'Global site title, brand logos, and footer configuration',
        isSecret: false,
        updatedBy: userId,
      },
      update: {
        value: updated as any,
        updatedBy: userId,
      },
    });

    return updated;
  }

  // 4. Admin: Get Stripe configuration with masked secret keys
  async getStripeConfig(): Promise<any> {
    try {
      const setting = await this.prisma.platformSetting.findUnique({
        where: { key: 'STRIPE_CONFIG' },
      });

      const raw: StripeConfig = setting?.value
        ? { ...DEFAULT_STRIPE_CONFIG, ...(setting.value as any) }
        : DEFAULT_STRIPE_CONFIG;

      // Mask secret keys for safe UI presentation
      return {
        ...raw,
        testSecretKey: raw.testSecretKey ? this.maskKey(raw.testSecretKey) : '',
        testWebhookSecret: raw.testWebhookSecret ? this.maskKey(raw.testWebhookSecret) : '',
        liveSecretKey: raw.liveSecretKey ? this.maskKey(raw.liveSecretKey) : '',
        liveWebhookSecret: raw.liveWebhookSecret ? this.maskKey(raw.liveWebhookSecret) : '',
        hasTestSecretKey: Boolean(raw.testSecretKey),
        hasLiveSecretKey: Boolean(raw.liveSecretKey),
      };
    } catch {
      return DEFAULT_STRIPE_CONFIG;
    }
  }

  // 5. Admin: Update Stripe configuration
  async updateStripeConfig(dto: Partial<StripeConfig>, userId: string) {
    const existing = await this.prisma.platformSetting.findUnique({
      where: { key: 'STRIPE_CONFIG' },
    });

    const currentRaw: StripeConfig = existing?.value
      ? { ...DEFAULT_STRIPE_CONFIG, ...(existing.value as any) }
      : DEFAULT_STRIPE_CONFIG;

    const updatedRaw: StripeConfig = {
      ...currentRaw,
      ...dto,
      // If client sent empty/masked secret key, keep existing secret
      testSecretKey:
        dto.testSecretKey && !dto.testSecretKey.includes('•••')
          ? dto.testSecretKey.trim()
          : currentRaw.testSecretKey,
      testWebhookSecret:
        dto.testWebhookSecret && !dto.testWebhookSecret.includes('•••')
          ? dto.testWebhookSecret.trim()
          : currentRaw.testWebhookSecret,
      liveSecretKey:
        dto.liveSecretKey && !dto.liveSecretKey.includes('•••')
          ? dto.liveSecretKey.trim()
          : currentRaw.liveSecretKey,
      liveWebhookSecret:
        dto.liveWebhookSecret && !dto.liveWebhookSecret.includes('•••')
          ? dto.liveWebhookSecret.trim()
          : currentRaw.liveWebhookSecret,
    };

    await this.prisma.platformSetting.upsert({
      where: { key: 'STRIPE_CONFIG' },
      create: {
        key: 'STRIPE_CONFIG',
        value: updatedRaw as any,
        description: 'Global Stripe payment gateway credentials and mode',
        isSecret: true,
        updatedBy: userId,
      },
      update: {
        value: updatedRaw as any,
        updatedBy: userId,
      },
    });

    return this.getStripeConfig();
  }

  // 6. Admin: Test Stripe connection
  async testStripeConnection() {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: 'STRIPE_CONFIG' },
    });

    const config: StripeConfig = setting?.value
      ? { ...DEFAULT_STRIPE_CONFIG, ...(setting.value as any) }
      : DEFAULT_STRIPE_CONFIG;

    const activeSecretKey =
      config.mode === 'live' ? config.liveSecretKey : config.testSecretKey;

    if (!activeSecretKey) {
      return {
        success: false,
        mode: config.mode,
        message: `No ${config.mode.toUpperCase()} Stripe Secret Key configured. Please enter a valid Secret Key.`,
      };
    }

    try {
      // Test by making a simple balance or account retrieve call
      const Stripe = require('stripe');
      const stripeClient = new Stripe(activeSecretKey, { apiVersion: '2023-10-16' });
      const balance = await stripeClient.balance.retrieve();

      return {
        success: true,
        mode: config.mode,
        message: `Successfully connected to Stripe API in ${config.mode.toUpperCase()} mode!`,
        currency: balance.available?.[0]?.currency?.toUpperCase() || config.defaultCurrency,
      };
    } catch (err: any) {
      return {
        success: false,
        mode: config.mode,
        message: err.message || 'Failed to authenticate with Stripe. Check your Secret Key.',
      };
    }
  }

  private maskKey(key: string): string {
    if (!key || key.length < 8) return '••••••••';
    const prefix = key.slice(0, 7);
    const suffix = key.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }
}
