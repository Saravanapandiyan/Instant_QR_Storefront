import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';
import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
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
};
