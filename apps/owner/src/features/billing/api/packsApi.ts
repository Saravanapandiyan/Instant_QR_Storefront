import { apiClient } from '../../../lib/api-client';

export interface DynamicPack {
  id: string;
  code: string;
  name: string;
  ordersCount: number;
  bonusCredits: number;
  priceUsd: string | number;
  priceInr: string | number;
  regionalPricingJson?: Record<string, number> | null;
  featuresJson?: {
    qrMenu?: boolean;
    aiMenuImport?: boolean;
    counterDashboard?: boolean;
    liveOrderStatus?: boolean;
    dailyReports?: boolean;
    kitchenScreen?: boolean;
    multiLanguage?: boolean;
    tvDisplay?: boolean;
    multiCounter?: boolean;
    staffRoles?: boolean;
    multiOutlets?: boolean;
    prioritySupport?: boolean;
    [key: string]: any;
  } | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackInput {
  code: string;
  name: string;
  ordersCount: number;
  bonusCredits?: number;
  priceUsd: number;
  priceInr: number;
  regionalPricingJson?: Record<string, number>;
  featuresJson?: Record<string, boolean>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePackInput extends Partial<CreatePackInput> {}

export const packsApi = {
  /**
   * Fetch active credit packs for restaurant owners
   */
  getActivePacks: async (): Promise<DynamicPack[]> => {
    return apiClient.get<DynamicPack[]>('/packs');
  },

  /**
   * Super Admin: Fetch all packs including inactive
   */
  getAllPacks: async (): Promise<DynamicPack[]> => {
    return apiClient.get<DynamicPack[]>('/packs/admin/all');
  },

  /**
   * Get single pack details
   */
  getPackById: async (id: string): Promise<DynamicPack> => {
    return apiClient.get<DynamicPack>(`/packs/${id}`);
  },

  /**
   * Super Admin: Create a new promotional or standard pack
   */
  createPack: async (data: CreatePackInput): Promise<DynamicPack> => {
    return apiClient.post<DynamicPack>('/packs', data);
  },

  /**
   * Super Admin: Update pricing, bonus credits, or features
   */
  updatePack: async (id: string, data: UpdatePackInput): Promise<DynamicPack> => {
    return apiClient.patch<DynamicPack>(`/packs/${id}`, data);
  },

  /**
   * Super Admin: Delete or deactivate pack
   */
  deletePack: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/packs/${id}`);
  },
};
