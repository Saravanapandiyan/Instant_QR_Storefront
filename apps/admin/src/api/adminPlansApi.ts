import { adminApiClient } from '../lib/api-client.ts';

export interface PlanFeatures {
  qrMenu?: boolean;
  aiMenuImport?: boolean;
  liveOrderStatus?: boolean;
  counterDashboard?: boolean;
  kitchenScreen?: boolean;
  tvDisplay?: boolean;
  multiLanguage?: boolean;
  staffRoles?: boolean;
  multiCounter?: boolean;
  multiOutlets?: boolean;
  dailyReports?: boolean;
  prioritySupport?: boolean;
  [key: string]: boolean | undefined;
}

export interface AdminPack {
  id: string;
  code: string;
  name: string;
  ordersCount: number;
  bonusCredits: number;
  priceUsd: number | string;
  priceInr: number | string;
  regionalPricingJson?: Record<string, number> | null;
  featuresJson?: PlanFeatures | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPayload {
  code: string;
  name: string;
  ordersCount: number;
  bonusCredits?: number;
  priceUsd: number;
  priceInr: number;
  regionalPricingJson?: Record<string, number> | null;
  featuresJson?: PlanFeatures | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {}

export const adminPlansApi = {
  getAllPacks: () => adminApiClient.get<AdminPack[]>('packs/admin/all'),
  getPackById: (id: string) => adminApiClient.get<AdminPack>(`packs/${id}`),
  createPack: (data: CreatePlanPayload) => adminApiClient.post<AdminPack>('packs', data),
  updatePack: (id: string, data: UpdatePlanPayload) =>
    adminApiClient.patch<AdminPack>(`packs/${id}`, data),
  deletePack: (id: string) => adminApiClient.delete<{ success: boolean }>(`packs/${id}`),
};
