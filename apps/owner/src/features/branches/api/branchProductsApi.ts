import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';

export interface BranchProductItem {
  id: string;
  branchId: string;
  productId: string;
  isAvailable: boolean;
  isEnabled: boolean;
  priceOverride: number | null;
  product?: {
    id: string;
    name: string;
    description?: string;
    basePrice: number | string;
    imageUrl?: string;
    categoryId: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

export interface BranchMenuResponse {
  branch: {
    id: string;
    name: string;
    slug: string;
    currency?: string;
    address?: string | null;
    phone?: string | null;
    countryCode?: string | null;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    defaultCurrency?: string;
  };
  isCrossCurrency?: boolean;
  categories: Array<{
    id: string;
    name: string;
    description?: string | null;
    sortOrder: number;
    products?: any[];
  }>;
  items?: Array<{
    id: string;
    name: string;
    description?: string | null;
    basePrice: number | string;
    finalPrice: number | string | null;
    priceOverride?: number | string | null;
    requiresLocalPrice?: boolean;
    imageUrl?: string | null;
    categoryId: string;
    categoryName: string;
    isAvailable: boolean;
    isEnabled: boolean;
  }>;
}

export const branchProductsApi = {
  // 1. One-click Toggle In-Stock / Sold Out for a specific branch
  toggleAvailability: async (branchId: string, productId: string): Promise<any> => {
    return apiClient.patch(API_ENDPOINTS.BRANCH_PRODUCTS.TOGGLE_AVAILABILITY(branchId, productId));
  },

  // 2. Update branch stock, price override, or enablement (Disable/Enable for this branch)
  updateOverride: async (
    branchId: string,
    productId: string,
    data: { isAvailable?: boolean; priceOverride?: number | null; isEnabled?: boolean },
  ): Promise<any> => {
    return apiClient.patch(API_ENDPOINTS.BRANCH_PRODUCTS.OVERRIDE(branchId, productId), data);
  },

  // 3. Get Full Branch Menu
  getBranchMenu: async (branchId: string): Promise<BranchMenuResponse> => {
    return apiClient.get<BranchMenuResponse>(API_ENDPOINTS.BRANCH_PRODUCTS.MENU(branchId));
  },

  // 4. Get Multi-Branch Pricing & Stock Matrix for a Restaurant Concept
  getRestaurantMatrix: async (restaurantId: string): Promise<any> => {
    return apiClient.get<any>(API_ENDPOINTS.BRANCH_PRODUCTS.MATRIX(restaurantId));
  },
};
