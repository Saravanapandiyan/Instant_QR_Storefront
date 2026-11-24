import { adminApiClient } from '../lib/api-client.ts';

export interface AdminRestaurantBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface AdminRestaurantOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  countryCode: string | null;
}

export interface AdminRestaurantTenant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  creditBalance: number;
  planTier: 'FREE' | 'PAID';
  isActive: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
  createdAt: string;
  owner: AdminRestaurantOwner;
  branchesCount: number;
  productsCount: number;
  categoriesCount: number;
  ordersCount?: number;
  branches: AdminRestaurantBranch[];
}

export interface AdminRestaurantsResponse {
  counts: {
    all: number;
    active: number;
    pendingReview: number;
    suspended: number;
    free: number;
    paid: number;
  };
  restaurants: AdminRestaurantTenant[];
}

export interface AdminRestaurantDetail extends AdminRestaurantTenant {
  categories: Array<{
    id: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    _count: { products: number };
  }>;
}

export const adminRestaurantsApi = {
  getRestaurants: (params?: { search?: string; status?: string; planTier?: string }) =>
    adminApiClient.get<AdminRestaurantsResponse>('admin/restaurants', params),

  getRestaurantById: (id: string) =>
    adminApiClient.get<AdminRestaurantDetail>(`admin/restaurants/${id}`),

  updateStatus: (id: string, isActive: boolean) =>
    adminApiClient.patch<{ id: string; name: string; isActive: boolean; status: string; message: string }>(
      `admin/restaurants/${id}/status`,
      { isActive }
    ),

  adjustCredits: (restaurantId: string, data: { delta: number; reason: string; notes?: string }) =>
    adminApiClient.post<{ success: boolean; message: string; newBalance: number }>(
      `admin/restaurants/${restaurantId}/credits/adjust`,
      data
    ),

  impersonate: (restaurantId: string) =>
    adminApiClient.post<{ accessToken: string; user: any; restaurant: { id: string; name: string; slug: string } }>(
      `admin/restaurants/${restaurantId}/impersonate`
    ),
};

