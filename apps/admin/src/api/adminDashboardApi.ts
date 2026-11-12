import { adminApiClient } from '../lib/api-client.ts';

export interface AdminDashboardStats {
  restaurants: {
    total: number;
    active: number;
    pending: number;
    growthPercentage: number;
  };
  branches: {
    total: number;
    active: number;
    availabilityRate: number;
  };
  catalog: {
    totalProducts: number;
    totalCategories: number;
  };
  users: {
    total: number;
    owners: number;
    superAdmins: number;
  };
  orders: {
    total: number;
    grossVolume: number;
    currency: string;
    growthPercentage: number;
  };
}

export interface VelocityDataPoint {
  date: string;
  orders: number;
  gmv: number;
}

export interface RecentTenantFleet {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    countryCode: string | null;
  };
  branchesCount: number;
  productsCount: number;
  currency: string;
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED';
  createdAt: string;
}

export const adminDashboardApi = {
  getStats: () => adminApiClient.get<AdminDashboardStats>('admin/dashboard/stats'),
  getVelocity: () => adminApiClient.get<VelocityDataPoint[]>('admin/dashboard/velocity'),
  getRecentFleet: () => adminApiClient.get<RecentTenantFleet[]>('admin/dashboard/recent-fleet'),
};

