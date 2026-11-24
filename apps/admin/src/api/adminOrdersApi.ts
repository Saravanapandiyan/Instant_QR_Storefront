import { adminApiClient } from '../lib/api-client.ts';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AdminOrderItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemNotes?: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: number;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  branchId: string;
  branchName: string;
  branchSlug: string;
  currency: string;
  tableNumber: string | null;
  customerName: string;
  customerPhone: string;
  orderNotes?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status: OrderStatus;
  paymentMethod: 'CASH' | 'STRIPE' | 'UPI' | 'CARD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotal: number;
  tax: number;
  totalAmount: number;
  prepTimeMinutes?: number | null;
  itemsCount: number;
  items: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrdersResponse {
  counts: {
    all: number;
    pending: number;
    active: number;
    confirmed: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
    totalGmv: number;
  };
  orders: AdminOrder[];
  pagination?: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminOrdersQuery {
  restaurantId?: string;
  branchId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const adminOrdersApi = {
  getOrders: (params?: AdminOrdersQuery) =>
    adminApiClient.get<AdminOrdersResponse>('admin/orders', {
      restaurantId: params?.restaurantId && params.restaurantId !== 'ALL' ? params.restaurantId : undefined,
      branchId: params?.branchId && params.branchId !== 'ALL' ? params.branchId : undefined,
      status: params?.status && params.status !== 'ALL' ? params.status : undefined,
      search: params?.search,
      startDate: params?.startDate,
      endDate: params?.endDate,
      page: params?.page,
      limit: params?.limit || 50,
    }),

  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    adminApiClient.patch<{ success: boolean; message: string; order: any }>(
      `admin/orders/${orderId}/status`,
      { status },
    ),
};
