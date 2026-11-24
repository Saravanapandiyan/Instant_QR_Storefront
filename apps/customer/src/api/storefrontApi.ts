import type { StorefrontBranch, StorefrontMenuData } from '../types/storefront.ts';

const API_BASE = '/api/v1';
const CACHE_KEY_PREFIX = 'instadine_cached_menu_';

export async function fetchBranchBySlug(slug: string): Promise<StorefrontBranch & { restaurant: any }> {
  const res = await fetch(`${API_BASE}/branches/slug/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Branch with link "/r/${slug}" was not found.`);
    }
    throw new Error('Failed to load restaurant branch information.');
  }
  return res.json();
}

export async function fetchBranchMenu(branchId: string): Promise<StorefrontMenuData> {
  const res = await fetch(`${API_BASE}/branch-products/branch/${encodeURIComponent(branchId)}/menu`);
  if (!res.ok) {
    throw new Error('Failed to load branch menu catalogue.');
  }
  return res.json();
}

export async function fetchStorefrontBySlug(slug: string): Promise<StorefrontMenuData> {
  const cacheKey = `${CACHE_KEY_PREFIX}${slug}`;

  try {
    // 1. Resolve branch by public slug
    const branchData = await fetchBranchBySlug(slug);

    // 2. Fetch full branch menu & stock matrix
    const menuData = await fetchBranchMenu(branchData.id);

    // Ensure restaurant themeConfig from branch lookup is preserved
    if (branchData.restaurant && !menuData.restaurant.themeConfig) {
      menuData.restaurant.themeConfig = branchData.restaurant.themeConfig;
    }

    // Persist snapshot to localStorage for offline / poor network resilience
    try {
      localStorage.setItem(cacheKey, JSON.stringify(menuData));
    } catch {
      // quota exceeded or disabled
    }

    return menuData;
  } catch (err) {
    // Offline / Network Failure Fallback: Load saved menu snapshot
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as StorefrontMenuData;
        (parsed as any).isOfflineCached = true;
        return parsed;
      }
    } catch {
      // ignore
    }
    throw err;
  }
}

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

export async function fetchPlatformBranding(): Promise<PlatformBranding> {
  try {
    const res = await fetch(`${API_BASE}/platform/branding`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return {
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
}


