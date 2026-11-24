import { adminApiClient } from '../lib/api-client.ts';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF';

export interface AdminUserRestaurant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  rawPhone: string | null;
  countryCode: string | null;
  role: UserRole;
  isPlatformAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  restaurants: AdminUserRestaurant[];
}

export interface AdminUsersCounts {
  total: number;
  owners: number;
  staff: number;
  superAdmins: number;
}

export interface AdminUsersResponse {
  counts: AdminUsersCounts;
  users: AdminUserListItem[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  countryCode?: string;
  phone?: string;
  role: UserRole;
  restaurantId?: string;
  pinCode?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  role?: UserRole;
  password?: string;
  pinCode?: string;
}

export interface AdminUsersQuery {
  search?: string;
  role?: string;
  status?: 'ALL' | 'ACTIVE' | 'DEACTIVATED';
  restaurantId?: string;
}

export const adminUsersApi = {
  getUsers: (params?: AdminUsersQuery): Promise<AdminUsersResponse> =>
    adminApiClient.get<AdminUsersResponse>('admin/users', {
      search: params?.search,
      role: params?.role && params.role !== 'ALL' ? params.role : undefined,
      status: params?.status && params.status !== 'ALL' ? params.status : undefined,
      restaurantId: params?.restaurantId && params.restaurantId !== 'ALL' ? params.restaurantId : undefined,
    }),

  getUserById: (id: string): Promise<AdminUserListItem> =>
    adminApiClient.get<AdminUserListItem>(`admin/users/${id}`),

  createUser: (data: CreateUserPayload): Promise<AdminUserListItem> =>
    adminApiClient.post<AdminUserListItem>('admin/users', data),

  updateUser: (id: string, data: UpdateUserPayload): Promise<AdminUserListItem> =>
    adminApiClient.patch<AdminUserListItem>(`admin/users/${id}`, data),

  deleteUser: (id: string): Promise<{ success: boolean; message: string }> =>
    adminApiClient.delete<{ success: boolean; message: string }>(`admin/users/${id}`),

  updateUserRole: (
    id: string,
    role: UserRole,
  ): Promise<{ message: string; user: AdminUserListItem }> =>
    adminApiClient.patch<{ message: string; user: AdminUserListItem }>(`admin/users/${id}/role`, {
      role,
    }),

  updateUserStatus: (
    id: string,
    isActive: boolean,
  ): Promise<{ message: string; user: AdminUserListItem }> =>
    adminApiClient.patch<{ message: string; user: AdminUserListItem }>(`admin/users/${id}/status`, {
      isActive,
    }),
};
