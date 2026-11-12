import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';
import type {
  StaffMember,
  CreateStaffInput,
  UpdateStaffInput,
} from '@instant-qr/shared-types';

export const staffApi = {
  getByRestaurant: async (restaurantId: string): Promise<StaffMember[]> => {
    return apiClient.get<StaffMember[]>(API_ENDPOINTS.STAFF.BY_RESTAURANT(restaurantId));
  },

  create: async (restaurantId: string, data: CreateStaffInput): Promise<StaffMember> => {
    return apiClient.post<StaffMember>(API_ENDPOINTS.STAFF.BY_RESTAURANT(restaurantId), data);
  },

  update: async (id: string, data: UpdateStaffInput): Promise<StaffMember> => {
    return apiClient.patch<StaffMember>(API_ENDPOINTS.STAFF.BY_ID(id), data);
  },

  toggleActive: async (id: string): Promise<StaffMember> => {
    return apiClient.patch<StaffMember>(API_ENDPOINTS.STAFF.TOGGLE_ACTIVE(id));
  },

  remove: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.STAFF.BY_ID(id));
  },
};

