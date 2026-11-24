const API_BASE = '/api/v1';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  branchSlug: string;
  customerName: string;
  customerPhone: string;
  tableNumber?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  orderNotes?: string;
  paymentMethod: 'CASH' | 'STRIPE';
  turnstileToken?: string;
  items: CreateOrderItemInput[];
}

export interface PlacedOrder {
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
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
  }[];
  branch: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    address?: string;
    phone?: string;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    defaultCurrency: string;
    themeConfig?: {
      receiptWidth?: '80mm' | '58mm';
      [key: string]: any;
    } | null;
  };
}

export async function placeCashOrder(input: CreateOrderInput): Promise<{ message: string; order: PlacedOrder }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to place order. Please try again.');
  }

  return data;
}

export async function fetchOrderDetails(orderId: string): Promise<PlacedOrder> {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch order status.');
  }
  return data;
}

