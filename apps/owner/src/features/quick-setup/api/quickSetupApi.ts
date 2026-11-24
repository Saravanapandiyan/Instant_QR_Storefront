import { request } from '../../../lib/api-client';

export interface MenuItem {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface QuickSetupPayload {
  restaurantName: string;
  currency: string;
  serviceType: string;
  tablesCount: number;
  staffName?: string;
  staffRole?: string;
  staffPin?: string;
  categories: MenuCategory[];
}

export interface QuickSetupResponse {
  success: boolean;
  message: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    creditBalance: number;
  };
  branch: {
    id: string;
    name: string;
    slug: string;
    storefrontPath: string;
  };
  counts: {
    categoriesCount: number;
    productsCount: number;
    freeCredits: number;
  };
  staff?: {
    name: string;
    role: string;
    pinCode: string;
  } | null;
}

export const quickSetupApi = {
  importMenuFile: async (file: File): Promise<{ success: boolean; categories: MenuCategory[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/ai/menu-import', {
      method: 'POST',
      data: formData,
    });
  },

  generateDescription: async (dishName: string, categoryName?: string): Promise<{ success: boolean; description: string }> => {
    return request('/ai/generate-description', {
      method: 'POST',
      data: { dishName, categoryName },
    });
  },

  findDishImage: async (dishName: string): Promise<{ success: boolean; imageUrl: string; source: string }> => {
    return request('/ai/dish-image', {
      method: 'POST',
      data: { dishName },
    });
  },

  submitQuickSetup: async (payload: QuickSetupPayload): Promise<QuickSetupResponse> => {
    return request('/ai/quick-setup', {
      method: 'POST',
      data: payload,
    });
  },

  bulkImportToConcept: async (restaurantId: string, categories: MenuCategory[]): Promise<any> => {
    return request('/ai/bulk-import-menu', {
      method: 'POST',
      data: { restaurantId, categories },
    });
  },
};
