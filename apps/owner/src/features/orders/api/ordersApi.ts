import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
  product?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
}

export interface Order {
  id: string;
  orderNumber: number;
  restaurantId: string;
  branchId: string;
  tableNumber?: string | null;
  customerName: string;
  customerPhone: string;
  orderNotes?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: 'CASH' | 'STRIPE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  subtotal: number;
  tax: number;
  totalAmount: number;
  prepTimeMinutes?: number | null;
  prepStartedAt?: string | null;
  estimatedReadyAt?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  branch: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface TvBoardOrder {
  id: string;
  orderNumber: number;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: string | null;
  customerName?: string | null;
  status: 'CONFIRMED' | 'PREPARING' | 'READY';
  prepTimeMinutes?: number | null;
  prepStartedAt?: string | null;
  estimatedReadyAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TvBoardResponse {
  restaurantName: string;
  branchName: string;
  restaurantId?: string;
  branchId?: string;
  orders: TvBoardOrder[];
}

export interface OrdersListResponse {
  counts: {
    all: number;
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  orders: Order[];
}

export const ordersApi = {
  getOrders: async (
    restaurantId: string,
    params?: { status?: string; branchId?: string; startDate?: string; endDate?: string },
  ): Promise<OrdersListResponse> => {
    return apiClient.get<OrdersListResponse>(
      API_ENDPOINTS.ORDERS.BY_RESTAURANT(restaurantId),
      { params },
    );
  },

  updateOrderStatus: async (
    orderId: string,
    status: string,
    cancelReason?: string,
    prepTimeMinutes?: number,
  ) => {
    return apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
      status,
      cancelReason,
      prepTimeMinutes,
    });
  },

  updatePaymentStatus: async (orderId: string, paymentStatus: 'PAID' | 'PENDING') => {
    return apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_PAYMENT(orderId), {
      paymentStatus,
    });
  },

  getTvBoardOrders: async (targetId: string): Promise<TvBoardResponse> => {
    return apiClient.get<TvBoardResponse>(API_ENDPOINTS.ORDERS.TV_BOARD(targetId));
  },
};

