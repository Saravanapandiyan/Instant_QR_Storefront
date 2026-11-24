import type { StorefrontThemeConfig } from '@instant-qr/shared-types';

export interface StorefrontBranch {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  countryCode: string | null;
  currency: string;
}

export interface StorefrontRestaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  themeConfig?: StorefrontThemeConfig | null;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  translations?: Record<string, { name: string; description?: string }> | null;
}

export interface StorefrontItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | number;
  finalPrice: string | number;
  priceOverride: string | number | null;
  requiresLocalPrice?: boolean;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  translations?: Record<string, { name: string; description?: string }> | null;
  categoryTranslations?: Record<string, { name: string; description?: string }> | null;
  isAvailable: boolean; // false = Sold Out
  isEnabled: boolean;
  isVeg?: boolean;
  isBestseller?: boolean;
}

export interface StorefrontMenuData {
  branch: StorefrontBranch;
  restaurant: StorefrontRestaurant;
  categories: StorefrontCategory[];
  items: StorefrontItem[];
  isCrossCurrency: boolean;
}

export interface CartItem {
  item: StorefrontItem;
  quantity: number;
  notes?: string;
}

