import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlatformBranding {
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

interface BrandState {
  appName: string;
  appTagline: string;
  appLogoUrl: string | null;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  supportEmail: string | null;
  poweredByText: string;
  poweredByLink: string;
  showPoweredByBadge: boolean;
  customFooterNote: string;
  setBrandConfig: (config: Partial<Omit<BrandState, 'setBrandConfig' | 'syncPlatformBranding'>>) => void;
  syncPlatformBranding: () => Promise<void>;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      appName: 'InstaDine',
      appTagline: 'Turn every table into a storefront.',
      appLogoUrl: null,
      lightLogoUrl: null,
      darkLogoUrl: null,
      faviconUrl: null,
      supportEmail: 'support@instadine.com',
      poweredByText: 'Powered by InstaDine',
      poweredByLink: '/register',
      showPoweredByBadge: true,
      customFooterNote: 'Multi-restaurant touchless QR storefront platform.',

      setBrandConfig: (config) =>
        set((state) => ({
          ...state,
          ...config,
        })),

      syncPlatformBranding: async () => {
        try {
          const res = await fetch('/api/v1/platform/branding');
          if (res.ok) {
            const data: PlatformBranding = await res.json();
            const resolvedTitle = data.siteTitle || 'InstaDine';
            const resolvedLogo = data.lightLogoUrl || data.darkLogoUrl || null;

            // Dynamically update document title
            if (typeof document !== 'undefined') {
              if (document.title.includes('|')) {
                const parts = document.title.split('|');
                document.title = `${parts[0].trim()} | ${resolvedTitle}`;
              } else {
                document.title = `${resolvedTitle} — Restaurant Portal`;
              }

              // Update favicon if provided
              if (data.faviconUrl) {
                let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
                if (!link) {
                  link = document.createElement('link');
                  link.rel = 'icon';
                  document.head.appendChild(link);
                }
                link.href = data.faviconUrl;
              }
            }

            set((state) => ({
              ...state,
              appName: resolvedTitle,
              appTagline: data.siteTagline || state.appTagline,
              appLogoUrl: resolvedLogo,
              lightLogoUrl: data.lightLogoUrl ?? null,
              darkLogoUrl: data.darkLogoUrl ?? null,
              faviconUrl: data.faviconUrl ?? null,
              supportEmail: data.supportEmail ?? null,
              poweredByText: data.poweredByText || state.poweredByText,
              poweredByLink: data.poweredByLink || state.poweredByLink,
              showPoweredByBadge: data.showPoweredByBadge !== undefined ? data.showPoweredByBadge : true,
              customFooterNote: data.customFooterNote || state.customFooterNote,
            }));
          }
        } catch {
          // ignore network error
        }
      },
    }),
    {
      name: 'instant-qr-brand-config',
    }
  )
);
