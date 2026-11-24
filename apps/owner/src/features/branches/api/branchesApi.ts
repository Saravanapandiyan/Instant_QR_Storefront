import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
  RestaurantTable,
} from '@instant-qr/shared-types';

export const branchesApi = {
  getMyBranches: async (): Promise<Branch[]> => {
    return apiClient.get<Branch[]>(API_ENDPOINTS.BRANCHES.MINE);
  },

  getBranchesByRestaurant: async (restaurantId: string): Promise<Branch[]> => {
    return apiClient.get<Branch[]>(API_ENDPOINTS.BRANCHES.BY_RESTAURANT(restaurantId));
  },

  getBranchById: async (id: string): Promise<Branch> => {
    return apiClient.get<Branch>(API_ENDPOINTS.BRANCHES.BY_ID(id));
  },

  getBranchBySlug: async (slug: string): Promise<Branch> => {
    return apiClient.get<Branch>(API_ENDPOINTS.BRANCHES.BY_SLUG(slug));
  },

  createBranch: async (data: CreateBranchInput): Promise<Branch> => {
    return apiClient.post<Branch>(API_ENDPOINTS.BRANCHES.BASE, data);
  },

  updateBranch: async (id: string, data: UpdateBranchInput): Promise<Branch> => {
    return apiClient.patch<Branch>(API_ENDPOINTS.BRANCHES.BY_ID(id), data);
  },

  deleteBranch: async (id: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.BRANCHES.BY_ID(id));
  },

  // Table Management & Live Status
  getBranchTables: async (branchId: string): Promise<RestaurantTable[]> => {
    return apiClient.get<RestaurantTable[]>(`/branches/${branchId}/tables`);
  },

  createTable: async (
    branchId: string,
    data: { tableNumber: string; section?: string; capacity?: number },
  ): Promise<RestaurantTable> => {
    return apiClient.post<RestaurantTable>(`/branches/${branchId}/tables`, data);
  },

  bulkCreateTables: async (
    branchId: string,
    data: { section?: string; prefix?: string; startNumber: number; count: number; capacity?: number },
  ): Promise<RestaurantTable[]> => {
    return apiClient.post<RestaurantTable[]>(`/branches/${branchId}/tables/bulk`, data);
  },

  updateTable: async (
    branchId: string,
    tableId: string,
    data: { tableNumber?: string; section?: string; capacity?: number; isActive?: boolean },
  ): Promise<RestaurantTable> => {
    return apiClient.patch<RestaurantTable>(`/branches/${branchId}/tables/${tableId}`, data);
  },

  deleteTable: async (branchId: string, tableId: string): Promise<void> => {
    return apiClient.delete<void>(`/branches/${branchId}/tables/${tableId}`);
  },
};
