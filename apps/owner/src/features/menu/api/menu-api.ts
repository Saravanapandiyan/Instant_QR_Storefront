import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  translations?: Record<string, { name: string; description?: string }> | null;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: string | number;
  price?: string | number;
  imageUrl?: string;
  translations?: Record<string, { name: string; description?: string }> | null;
  category?: {
    id: string;
    name: string;
  };
  branchProducts?: Array<{
    id: string;
    branchId: string;
    productId: string;
    isAvailable: boolean;
    isEnabled: boolean;
    priceOverride: number | null;
  }>;
}

// 1. Categories API
export const getCategories = async (restaurantId: string): Promise<Category[]> => {
  return apiClient.get<Category[]>(API_ENDPOINTS.CATEGORIES.BY_RESTAURANT(restaurantId));
};

export const createCategory = async (data: {
  restaurantId: string;
  name: string;
  description?: string;
}): Promise<Category> => {
  return apiClient.post<Category>(API_ENDPOINTS.CATEGORIES.BASE, data);
};

export const updateCategory = async (
  id: string,
  data: Partial<Pick<Category, 'name' | 'description' | 'isActive' | 'sortOrder'>>,
): Promise<Category> => {
  return apiClient.patch<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id), data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
};

// 2. Products API
export const getProducts = async (
  restaurantId: string,
  params?: { categoryId?: string; search?: string },
): Promise<Product[]> => {
  return apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.BY_RESTAURANT(restaurantId), { params });
};

export const createProduct = async (formData: FormData): Promise<Product> => {
  return apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.BASE, formData);
};

export const updateProduct = async (id: string, data: FormData | Partial<Product>): Promise<Product> => {
  return apiClient.patch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id), data);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
};

// 3. Translation API (Multilingual Gemini Flash)
export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isCustom?: boolean;
}

export const getSupportedLanguages = async (): Promise<SupportedLanguage[]> => {
  return apiClient.get<SupportedLanguage[]>('/ai/supported-languages');
};

export const addCustomLanguage = async (data: {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}): Promise<SupportedLanguage> => {
  return apiClient.post<SupportedLanguage>('/ai/languages', data);
};

export const deleteCustomLanguage = async (code: string): Promise<void> => {
  await apiClient.delete(`/ai/languages/${code}`);
};

export const translateMenu = async (restaurantId: string, targetLanguages: string[]) => {
  return apiClient.post<{
    success: boolean;
    languages: string[];
    totalUpdated: number;
    message: string;
  }>('/ai/translate-menu', {
    restaurantId,
    targetLanguages,
  });
};

export const updateProductTranslation = async (
  productId: string,
  data: { langCode: string; name: string; description?: string },
) => {
  return apiClient.put(`/ai/translation/product/${productId}`, data);
};

export const updateCategoryTranslation = async (
  categoryId: string,
  data: { langCode: string; name: string; description?: string },
) => {
  return apiClient.put(`/ai/translation/category/${categoryId}`, data);
};
