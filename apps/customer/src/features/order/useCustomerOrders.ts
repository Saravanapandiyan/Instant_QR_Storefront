import { useState, useEffect, useCallback } from 'react';
import type { PlacedOrder } from '../../api/ordersApi';
import { fetchOrderDetails } from '../../api/ordersApi';
import { notifyCustomerOrderReady } from '../../utils/customerAudio';

const STORAGE_KEY = 'iqr_customer_orders_v1';

export interface StoredCustomerOrder {
  id: string;
  orderNumber: number;
  restaurantId: string;
  restaurantName: string;
  branchId: string;
  branchName: string;
  branchSlug: string;
  customerName: string;
  customerPhone: string;
  tableNumber?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  itemCount: number;
  itemSummary: string; // e.g. "Dragon chicken x 1"
  createdAt: string;
}

function getStoredOrders(): StoredCustomerOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read stored customer orders', e);
    return [];
  }
}

function persistOrders(orders: StoredCustomerOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, 30)));
  } catch (e) {
    console.error('Failed to persist customer orders', e);
  }
}

export function useCustomerOrders(branchSlug?: string) {
  const [orders, setOrders] = useState<StoredCustomerOrder[]>(() => getStoredOrders());

  // Save a newly placed order
  const savePlacedOrder = useCallback((placed: PlacedOrder) => {
    const itemSummary = placed.items.map((i) => `${i.productName} (${i.quantity})`).join(', ');

    const newStored: StoredCustomerOrder = {
      id: placed.id,
      orderNumber: placed.orderNumber,
      restaurantId: placed.restaurantId,
      restaurantName: placed.restaurant?.name || 'Restaurant',
      branchId: placed.branchId,
      branchName: placed.branch?.name || 'Branch',
      branchSlug: placed.branch?.slug || '',
      customerName: placed.customerName,
      customerPhone: placed.customerPhone,
      tableNumber: placed.tableNumber,
      orderType: placed.orderType,
      status: placed.status,
      paymentMethod: placed.paymentMethod,
      paymentStatus: placed.paymentStatus,
      totalAmount: Number(placed.totalAmount),
      itemCount: placed.items.reduce((sum, item) => sum + item.quantity, 0),
      itemSummary,
      createdAt: placed.createdAt,
    };

    setOrders((prev) => {
      const filtered = prev.filter((o) => o.id !== placed.id);
      const updated = [newStored, ...filtered];
      persistOrders(updated);
      return updated;
    });
  }, []);

  // Update status for a specific order in localStorage
  const updateOrderStatus = useCallback(
    (orderId: string, status: PlacedOrder['status'], paymentStatus?: string) => {
      setOrders((prev) => {
        let hasChanges = false;
        const updated = prev.map((o) => {
          if (o.id === orderId) {
            if (o.status !== status || (paymentStatus && o.paymentStatus !== paymentStatus)) {
              hasChanges = true;
              return {
                ...o,
                status,
                paymentStatus: paymentStatus || o.paymentStatus,
              };
            }
          }
          return o;
        });

        if (hasChanges) {
          persistOrders(updated);
          return updated;
        }
        return prev;
      });
    },
    [],
  );

  // Filter orders for current branch (if branchSlug provided)
  const branchOrders = branchSlug
    ? orders.filter(
        (o) =>
          !o.branchSlug ||
          o.branchSlug === branchSlug ||
          o.branchSlug.includes(branchSlug) ||
          branchSlug.includes(o.branchSlug),
      )
    : orders;

  // The latest active order (pending, confirmed, preparing, or ready)
  const activeOrder =
    branchOrders.find(
      (o) => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY',
    ) || null;

  // Background polling to keep active order status fresh in localStorage
  useEffect(() => {
    if (!activeOrder) return;

    let isMounted = true;
    const checkActive = async () => {
      try {
        const fresh = await fetchOrderDetails(activeOrder.id);
        if (isMounted && fresh) {
          updateOrderStatus(fresh.id, fresh.status, fresh.paymentStatus);

          // Trigger audible chime and vibration if order is READY
          if (fresh.status === 'READY') {
            notifyCustomerOrderReady({
              orderId: fresh.id,
              orderNumber: fresh.orderNumber,
              orderType: fresh.orderType,
              tableNumber: fresh.tableNumber,
              restaurantName: fresh.restaurant?.name,
            });
          }
        }
      } catch (err) {
        // quiet error on polling
      }
    };

    // Initial check
    checkActive();

    // Poll every 5s for active orders
    const timer = setInterval(checkActive, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeOrder?.id, updateOrderStatus]);

  return {
    orders: branchOrders,
    allOrders: orders,
    activeOrder,
    savePlacedOrder,
    updateOrderStatus,
  };
}

