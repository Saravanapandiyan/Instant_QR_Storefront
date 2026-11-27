import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ordersApi, type Order } from '../api/ordersApi';
import { useRestaurants } from '../../restaurants/hooks/useRestaurants';
import { useActiveStore } from '../../../store/useActiveStore';
import { NewOrderAlertModal } from './NewOrderAlertModal';
import { PrepTimeModal } from './PrepTimeModal';
import { startContinuousAlarm, stopContinuousAlarm, isSoundMuted } from '../../../lib/audioAlert';
import { toast } from '../../../components/ui';
import { getOwnerSocket } from '../../../lib/socket';

const SILENCED_KEY = 'instadine_silenced_orders';

const getSilencedOrderIds = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(SILENCED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const markOrderSilenced = (id: string) => {
  try {
    const s = getSilencedOrderIds();
    s.add(id);
    sessionStorage.setItem(SILENCED_KEY, JSON.stringify(Array.from(s)));
  } catch {
    // Ignore storage errors
  }
};

const isRecentOrder = (createdAt: string): boolean => {
  if (!createdAt) return true;
  try {
    const orderTime = new Date(createdAt).getTime();
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return orderTime > twentyFourHoursAgo;
  } catch {
    return true;
  }
};

export const GlobalOrderAlertManager: React.FC = () => {
  const { restaurants = [] } = useRestaurants();
  const activeRestaurantId = useActiveStore((state) => state.activeRestaurantId);

  const restaurantId = useMemo(() => {
    if (activeRestaurantId && restaurants.some((r) => r.id === activeRestaurantId)) {
      return activeRestaurantId;
    }
    return restaurants[0]?.id || activeRestaurantId || '';
  }, [activeRestaurantId, restaurants]);

  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  const incomingOrderRef = useRef<Order | null>(null);
  const [preppingOrder, setPreppingOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set of order IDs already acknowledged or alerted in this component session
  const acknowledgedOrderIdsRef = useRef<Set<string>>(new Set());

  // Check for pending orders
  const checkPendingOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      // Query solely for PENDING orders across all branches
      const res = await ordersApi.getOrders(restaurantId, {
        status: 'PENDING',
      });

      const pendingOrders = res.orders || [];

      // Multi-device sync: If this terminal has an active incoming alert showing,
      // check if another staff member or device has already accepted or handled it.
      if (incomingOrderRef.current) {
        const currentActiveId = incomingOrderRef.current.id;
        const stillPending = pendingOrders.some((o) => o.id === currentActiveId);
        if (!stillPending) {
          // Another terminal accepted/cancelled the order! Dismiss alert and stop alarm immediately.
          stopContinuousAlarm();
          incomingOrderRef.current = null;
          setIncomingOrder(null);
          toast.info('Order was accepted by another staff terminal.');
          window.dispatchEvent(new CustomEvent('instadine:orders_updated'));
          return;
        }
      }

      if (pendingOrders.length > 0) {
        const silenced = getSilencedOrderIds();
        // Find newest pending order not yet acknowledged or silenced
        const unacknowledged = pendingOrders.find(
          (o) =>
            o.status === 'PENDING' &&
            !acknowledgedOrderIdsRef.current.has(o.id) &&
            !silenced.has(o.id) &&
            isRecentOrder(o.createdAt),
        );

        if (unacknowledged) {
          incomingOrderRef.current = unacknowledged;
          setIncomingOrder(unacknowledged);
          if (!isSoundMuted()) {
            startContinuousAlarm();
          }
          // Notify any other active views on screen to refresh counters
          window.dispatchEvent(
            new CustomEvent('instadine:new_order', { detail: unacknowledged }),
          );
        }
      }
    } catch {
      // Background poll - fail silently
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    checkPendingOrders();

    const socket = getOwnerSocket();
    const joinRoom = () => {
      socket.emit('join:restaurant', { restaurantId });
    };
    const handleSocketOrder = () => {
      void checkPendingOrders();
    };
    const handleReconnect = () => {
      joinRoom();
      void checkPendingOrders();
    };

    joinRoom();
    socket.on('order:created', handleSocketOrder);
    socket.on('order:updated', handleSocketOrder);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('order:created', handleSocketOrder);
      socket.off('order:updated', handleSocketOrder);
      socket.off('connect', handleReconnect);
      socket.emit('leave:restaurant', { restaurantId });
      stopContinuousAlarm();
      incomingOrderRef.current = null;
    };
  }, [checkPendingOrders, restaurantId]);

  // Silence alert
  const handleSilence = () => {
    stopContinuousAlarm();
    if (incomingOrder) {
      acknowledgedOrderIdsRef.current.add(incomingOrder.id);
      markOrderSilenced(incomingOrder.id);
    }
    incomingOrderRef.current = null;
    setIncomingOrder(null);
  };

  // Accept -> opens Prep Time Modal
  const handleAccept = (order: Order) => {
    stopContinuousAlarm();
    if (incomingOrder) {
      acknowledgedOrderIdsRef.current.add(incomingOrder.id);
      markOrderSilenced(incomingOrder.id);
    }
    incomingOrderRef.current = null;
    setIncomingOrder(null);
    setPreppingOrder(order);
  };

  // Confirm prep time & deduct credit
  const handleConfirmPrep = async (
    orderId: string,
    prepTimeMinutes: number,
    paymentStatus?: string,
  ) => {
    setIsSubmitting(true);
    try {
      const targetPaymentStatus = (paymentStatus === 'PENDING' ? 'PENDING' : 'PAID') as 'PAID' | 'PENDING';
      await ordersApi.updateOrderStatus(
        orderId,
        'PREPARING',
        undefined,
        prepTimeMinutes,
        targetPaymentStatus,
      );
      // Synchronize exact selected payment status (PAID or PENDING)
      try {
        await ordersApi.updatePaymentStatus(orderId, targetPaymentStatus);
      } catch {
        // Ignore payment status error
      }

      toast.success(
        `Order #${preppingOrder?.orderNumber || ''} confirmed & in kitchen prep! 1 Credit deducted.`,
      );
      setPreppingOrder(null);
      // Dispatch global event so OrdersPage, KdsPage, and DashboardPage re-fetch immediately
      window.dispatchEvent(new CustomEvent('instadine:orders_updated'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Real-time Incoming Order Alert Floating Notification Card */}
      <NewOrderAlertModal
        order={incomingOrder}
        onSilence={handleSilence}
        onAccept={handleAccept}
      />

      {/* Preparation Time Selection Modal */}
      <PrepTimeModal
        isOpen={Boolean(preppingOrder)}
        onClose={() => setPreppingOrder(null)}
        order={preppingOrder}
        onConfirm={handleConfirmPrep}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
