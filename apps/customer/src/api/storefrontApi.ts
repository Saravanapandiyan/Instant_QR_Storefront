import type { StorefrontBranch, StorefrontMenuData } from '../types/storefront.ts';

const API_BASE = '/api/v1';

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
  // 1. Resolve branch by public slug
  const branchData = await fetchBranchBySlug(slug);

  // 2. Fetch full branch menu & stock matrix
  const menuData = await fetchBranchMenu(branchData.id);

  // Ensure restaurant themeConfig from branch lookup is preserved
  if (branchData.restaurant && !menuData.restaurant.themeConfig) {
    menuData.restaurant.themeConfig = branchData.restaurant.themeConfig;
  }

  return menuData;
}

