import { adminApiClient } from '../lib/api-client.ts';

export interface SiteBrandingConfig {
  siteTitle: string;
  siteTagline: string;
  supportEmail: string;
  defaultCurrency?: string;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  poweredByText: string;
  poweredByLink: string;
  showPoweredByBadge: boolean;
  customFooterNote: string;
}

export interface StripeAdminConfig {
  mode: 'test' | 'live';
  testPublishableKey: string;
  testSecretKey: string;
  testWebhookSecret?: string;
  livePublishableKey: string;
  liveSecretKey: string;
  liveWebhookSecret?: string;
  defaultCurrency: string;
  platformFeePercentage: number;
  isActive: boolean;
  hasTestSecretKey?: boolean;
  hasLiveSecretKey?: boolean;
}

export interface StripeTestConnectionResponse {
  success: boolean;
  mode: 'test' | 'live';
  message: string;
  currency?: string;
}

export const adminSettingsApi = {
  // Public or cached branding config
  getPublicBranding: () =>
    adminApiClient.get<SiteBrandingConfig>('platform/branding'),

  // Admin full branding settings
  getBranding: () =>
    adminApiClient.get<SiteBrandingConfig>('admin/settings/branding'),

  updateBranding: (data: Partial<SiteBrandingConfig>) =>
    adminApiClient.patch<SiteBrandingConfig>('admin/settings/branding', data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApiClient.post<{ url: string }>('admin/settings/upload-logo', formData);
  },

  // Stripe Gateway Settings
  getStripeConfig: () =>
    adminApiClient.get<StripeAdminConfig>('admin/settings/stripe'),

  updateStripeConfig: (data: Partial<StripeAdminConfig>) =>
    adminApiClient.patch<StripeAdminConfig>('admin/settings/stripe', data),

  testStripeConnection: () =>
    adminApiClient.post<StripeTestConnectionResponse>('admin/settings/stripe/test-connection'),
};
