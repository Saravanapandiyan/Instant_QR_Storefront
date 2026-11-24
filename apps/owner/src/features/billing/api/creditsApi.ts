import { apiClient } from '../../../lib/api-client';

export interface CreditBalanceInfo {
  restaurantId: string;
  restaurantName: string;
  creditBalance: number;
  isGraceMode: boolean;
  graceOrdersUsed: number;
  graceOrdersRemaining: number;
  isExhausted: boolean;
  isLowCredit: boolean;
}

export interface CreditLedgerEntry {
  id: string;
  restaurantId: string;
  delta: number;
  reason: 'FREE_SIGNUP' | 'ORDER_CONFIRMED' | 'PACK_PURCHASE' | 'GRACE_RECOVERY' | 'ADMIN_ADJUSTMENT' | 'REFUND' | string;
  refId: string | null;
  balanceAfter: number;
  createdAt: string;
}

export interface CreditLedgerResponse {
  entries: CreditLedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchasePackInput {
  restaurantId: string;
  packId: string;
  paymentMethod: 'STRIPE' | 'RAZORPAY' | 'MOCK_CARD';
  idempotencyKey?: string;
  currency?: string;
}

export interface StripeCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface CreateCheckoutSessionInput {
  restaurantId: string;
  packId: string;
  currency?: string;
}

export interface PurchasePackResponse {
  success: boolean;
  message: string;
  packName: string;
  creditsAdded: number;
  baseCredits?: number;
  bonusCredits?: number;
  newBalance: number;
  paymentMethod: string;
  invoiceRef: string;
  createdAt?: string;
}

export interface AdjustCreditsInput {
  restaurantId: string;
  delta: number;
  reason: string;
  notes?: string;
}

export const creditsApi = {
  /**
   * Get restaurant live credit balance and grace buffer metrics
   */
  getBalance: async (restaurantId: string): Promise<CreditBalanceInfo> => {
    return apiClient.get<CreditBalanceInfo>(`/credits/balance/${restaurantId}`);
  },

  /**
   * Get append-only transaction ledger audit trail
   */
  getLedger: async (restaurantId: string, limit = 50, page = 1): Promise<CreditLedgerResponse> => {
    return apiClient.get<CreditLedgerResponse>(`/credits/ledger/${restaurantId}?limit=${limit}&page=${page}`);
  },

  /**
   * Purchase a credit pack (transactional top-up)
   */
  purchasePack: async (data: PurchasePackInput): Promise<PurchasePackResponse> => {
    return apiClient.post<PurchasePackResponse>('/credits/purchase', data);
  },

  /**
   * Create a real Stripe Checkout Session for pack purchase
   */
  createCheckoutSession: async (data: CreateCheckoutSessionInput): Promise<StripeCheckoutResponse> => {
    return apiClient.post<StripeCheckoutResponse>('/credits/checkout', data);
  },

  /**
   * Verify completed Stripe checkout session and top up credits
   */
  verifySession: async (sessionId: string): Promise<PurchasePackResponse> => {
    return apiClient.post<PurchasePackResponse>('/credits/verify-session', { sessionId });
  },

  /**
   * Super Admin: Manual credit adjustment
   */
  adjustCredits: async (data: AdjustCreditsInput): Promise<{ success: boolean; message: string; newBalance: number }> => {
    return apiClient.post<{ success: boolean; message: string; newBalance: number }>('/credits/adjust', data);
  },
};
