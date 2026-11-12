import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
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
