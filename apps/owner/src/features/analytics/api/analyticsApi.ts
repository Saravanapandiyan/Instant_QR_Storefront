import { apiClient } from '../../../lib/api-client';

export interface AnalyticsSummary {
  totalGrossRevenue: number;
  totalTax: number;
  totalOrders: number;
  completedOrders: number;
  dineInOrders: number;
  takeawayOrders: number;
  cashOrdersCount: number;
  cashCollected: number;
  onlineOrdersCount: number;
  onlineCollected: number;
  averageOrderValue: number;
  averagePrepTimeMinutes: number;
}

export interface HourlyPeakData {
  hour: number;
  label: string;
  orderCount: number;
  revenue: number;
}

export interface TopDishData {
  name: string;
  quantity: number;
  revenue: number;
}

export interface TimelineData {
  date: string;
  count: number;
  revenue: number;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: number;
  customerName?: string | null;
  customerPhone?: string | null;
  orderType: string;
  tableNumber?: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  branchName?: string;
}

export interface AnalyticsResponse {
  restaurantId: string;
  restaurantName: string;
  currency: string;
  period: string;
  summary: AnalyticsSummary;
  hourlyPeak: HourlyPeakData[];
  topDishes: TopDishData[];
  timeline: TimelineData[];
  recentOrders: RecentOrderSummary[];
}

export const analyticsApi = {
  getAnalytics: async (
    restaurantId: string,
    params?: { branchId?: string; period?: string; startDate?: string; endDate?: string },
  ): Promise<AnalyticsResponse> => {
    return apiClient.get<AnalyticsResponse>(`/analytics/restaurant/${restaurantId}`, {
      params,
    });
  },
};
