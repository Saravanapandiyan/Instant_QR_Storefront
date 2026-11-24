import { adminApiClient } from '../lib/api-client.ts';

export interface AdminDishItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  restaurantId: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    defaultCurrency: string;
  };
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  inStock: boolean;
  branchProductsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDishesResponse {
  total: number;
  filteredCount: number;
  dishes: AdminDishItem[];
}

export interface CreateDishPayload {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
}

export interface UpdateDishPayload {
  name?: string;
  description?: string;
  basePrice?: number;
  imageUrl?: string;
  categoryId?: string;
}

export const adminDishesApi = {
  getDishes: (params?: {
    restaurantId?: string;
    branchId?: string;
    categoryId?: string;
    search?: string;
  }) =>
    adminApiClient.get<AdminDishesResponse>('admin/dishes', {
      restaurantId: params?.restaurantId && params.restaurantId !== 'ALL' ? params.restaurantId : undefined,
      branchId: params?.branchId && params.branchId !== 'ALL' ? params.branchId : undefined,
      categoryId: params?.categoryId && params.categoryId !== 'ALL' ? params.categoryId : undefined,
      search: params?.search,
    }),

  getDishById: (id: string) =>
    adminApiClient.get<AdminDishItem>(`admin/dishes/${id}`),

  createDish: (data: CreateDishPayload) =>
    adminApiClient.post<AdminDishItem>('admin/dishes', data),

  updateDish: (id: string, data: UpdateDishPayload) =>
    adminApiClient.patch<AdminDishItem>(`admin/dishes/${id}`, data),

  toggleStock: (id: string, inStock: boolean, branchId?: string) =>
    adminApiClient.patch<{ success: boolean; inStock: boolean; message: string }>(
      `admin/dishes/${id}/stock`,
      { inStock, branchId: branchId && branchId !== 'ALL' ? branchId : undefined }
    ),

  deleteDish: (id: string) =>
    adminApiClient.delete<{ success: boolean; message: string }>(`admin/dishes/${id}`),
};
