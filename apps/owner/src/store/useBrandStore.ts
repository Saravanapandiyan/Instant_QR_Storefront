import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BrandState {
  appName: string;
  appTagline: string;
  appLogoUrl: string | null;
  setBrandConfig: (config: Partial<Omit<BrandState, 'setBrandConfig'>>) => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      appName: 'Instant QR',
      appTagline: 'Multi-Tenant In-Store Dining & QR Storefront',
      appLogoUrl: null,

      setBrandConfig: (config) =>
        set((state) => ({
          ...state,
          ...config,
        })),
    }),
    {
      name: 'instant-qr-brand-config',
    }
  )
);
