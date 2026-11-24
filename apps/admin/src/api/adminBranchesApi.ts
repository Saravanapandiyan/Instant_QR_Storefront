import { adminApiClient } from '../lib/api-client.ts';

export interface AdminBranchItem {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  rawPhone: string | null;
  countryCode: string | null;
  currency: string;
  isActive: boolean;
  restaurantId: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    defaultCurrency: string;
    logoUrl: string | null;
  };
  tablesCount: number;
  ordersCount: number;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBranchesResponse {
  counts: {
    total: number;
    active: number;
    inactive: number;
  };
  branches: AdminBranchItem[];
}

export interface TableItem {
  id: string;
  branchId: string;
  tableNumber: string;
  section: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchPayload {
  restaurantId: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  currency?: string;
}

export interface UpdateBranchPayload {
  name?: string;
  slug?: string;
  address?: string;
  phone?: string;
  currency?: string;
  isActive?: boolean;
}

export const adminBranchesApi = {
  getBranches: (params?: { restaurantId?: string; search?: string; status?: string }) =>
    adminApiClient.get<AdminBranchesResponse>('admin/branches', {
      restaurantId: params?.restaurantId && params.restaurantId !== 'ALL' ? params.restaurantId : undefined,
      search: params?.search,
      status: params?.status && params.status !== 'ALL' ? params.status : undefined,
    }),

  getBranchById: (id: string) =>
    adminApiClient.get<AdminBranchItem & { tables: TableItem[] }>(`admin/branches/${id}`),

  createBranch: (data: CreateBranchPayload) =>
    adminApiClient.post<AdminBranchItem>('admin/branches', data),

  updateBranch: (id: string, data: UpdateBranchPayload) =>
    adminApiClient.patch<AdminBranchItem>(`admin/branches/${id}`, data),

  deleteBranch: (id: string) =>
    adminApiClient.delete<{ success: boolean; message: string }>(`admin/branches/${id}`),

  getTables: (branchId: string) =>
    adminApiClient.get<TableItem[]>(`admin/branches/${branchId}/tables`),

  createTable: (branchId: string, data: { tableNumber: string; section?: string; capacity?: number }) =>
    adminApiClient.post<TableItem>(`admin/branches/${branchId}/tables`, data),

  deleteTable: (branchId: string, tableId: string) =>
    adminApiClient.delete<{ success: boolean }>(`admin/branches/${branchId}/tables/${tableId}`),
};
