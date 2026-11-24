import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';

export interface PaymentSettingsResponse {
  restaurantId: string;
  restaurantName: string;
  enableCash: boolean;
  enableUpi: boolean;
  upiId: string;
  upiName: string;
  enableTax: boolean;
  taxRate: number;
  gstNumber?: string;
}

export interface UpdatePaymentSettingsPayload {
  enableCash: boolean;
  enableUpi?: boolean;
  upiId?: string;
  upiName?: string;
  enableTax?: boolean;
  taxRate?: number;
  gstNumber?: string;
}

export const paymentsApi = {
  getPaymentSettings: async (restaurantId: string): Promise<PaymentSettingsResponse> => {
    return apiClient.get<PaymentSettingsResponse>(
      API_ENDPOINTS.ORDERS.PAYMENT_SETTINGS(restaurantId),
    );
  },

  updatePaymentSettings: async (
    restaurantId: string,
    payload: UpdatePaymentSettingsPayload,
  ): Promise<PaymentSettingsResponse> => {
    return apiClient.patch<PaymentSettingsResponse>(
      API_ENDPOINTS.ORDERS.PAYMENT_SETTINGS(restaurantId),
      payload,
    );
  },
};

