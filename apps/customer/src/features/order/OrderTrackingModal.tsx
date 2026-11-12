import React, { useEffect, useState } from 'react';
import {
  Clock,
  ChefHat,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Banknote,
  RotateCw,
  X,
  MapPin,
  Check,
} from 'lucide-react';
import { fetchOrderDetails } from '../../api/ordersApi';
import type { PlacedOrder } from '../../api/ordersApi';

interface OrderTrackingModalProps {
  orderId: string;
  currencySymbol: string;
  onClose: () => void;
  onOrderAgain: () => void;
  onStatusUpdate?: (order: PlacedOrder) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  orderId,
  currencySymbol,
  onClose,
  onOrderAgain,
  onStatusUpdate,
}) => {
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadStatus = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await fetchOrderDetails(orderId);
      setOrder(data);
      onStatusUpdate?.(data);
    } catch (err) {
      console.error('Failed to load live order status', err);
    } finally {
      setLoading(false);
      if (showSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus(true);
    // Poll every 3.5 seconds to track kitchen progress live
    const interval = setInterval(() => {
      loadStatus(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full">
          <RotateCw className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const isCancelled = order.status === 'CANCELLED';
  const isPaid = order.paymentStatus === 'PAID';

  // Step definitions
  const steps = [
    { key: 'PENDING', label: 'Order Placed', sublabel: 'Sent to restaurant' },
    { key: 'PREPARING', label: 'In Kitchen', sublabel: 'Chef is cooking' },
    { key: 'READY', label: 'Ready', sublabel: order.orderType === 'DINE_IN' ? 'Ready to serve' : 'Ready for pickup' },
    { key: 'COMPLETED', label: 'Completed', sublabel: 'Enjoy your meal!' },
  ];

  const getStepState = (stepKey: string) => {
    if (isCancelled) return 'cancelled';

    const orderStatus = order.status;
    const rankMap: Record<string, number> = {
      PENDING: 1,
      CONFIRMED: 2,
      PREPARING: 2,
      READY: 3,
      COMPLETED: 4,
    };

    const currentRank = rankMap[orderStatus] || 1;
    const stepRank = rankMap[stepKey] || 1;

    if (currentRank > stepRank) return 'done';
    if (currentRank === stepRank) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in my-auto">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-zinc-50">
                Order #{order.orderNumber}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                {order.orderType === 'DINE_IN'
                  ? `Table ${order.tableNumber || '-'}`
                  : 'Takeaway'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-zinc-400" />
              {order.restaurant.name} ({order.branch.name})
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Tracker */}
          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  This order was cancelled
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  Reason: {order.cancelReason || 'Cancelled by restaurant staff.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              {/* Steps Progress */}
              <div className="grid grid-cols-4 gap-2 relative">
                {steps.map((st, idx) => {
                  const state = getStepState(st.key);
                  return (
                    <div key={st.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                          state === 'done'
                            ? 'bg-emerald-600 text-white'
                            : state === 'current'
                            ? 'bg-orange-600 text-white ring-4 ring-orange-500/20 animate-pulse'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {state === 'done' ? (
                          <Check className="w-4 h-4" />
                        ) : idx === 0 ? (
                          <Clock className="w-4 h-4" />
                        ) : idx === 1 ? (
                          <ChefHat className="w-4 h-4" />
                        ) : idx === 2 ? (
                          <ShoppingBag className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-2 leading-tight ${
                          state === 'current'
                            ? 'text-orange-600 dark:text-orange-400'
                            : state === 'done'
                            ? 'text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-400'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 hidden sm:inline-block mt-0.5">
                        {st.sublabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cash Payment Callout */}
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
              isPaid
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isPaid
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4
                  className={`font-bold text-xs sm:text-sm ${
                    isPaid
                      ? 'text-emerald-900 dark:text-emerald-200'
                      : 'text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {isPaid ? 'Payment Confirmed' : 'Pay Cash at Counter'}
                </h4>
                <p
                  className={`text-xs mt-0.5 ${
                    isPaid
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isPaid
                    ? 'Cash received by cashier. Thank you!'
                    : `Please pay ${currencySymbol}${order.totalAmount} in cash at the cashier desk.`}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                isPaid
                  ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-100'
              }`}
            >
              {isPaid ? 'Paid' : 'Pending Cash'}
            </span>
          </div>

          {/* Itemized Order Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Dishes Ordered
            </h4>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
              {order.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-orange-600">{item.quantity}x</span>
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.productName}
                      </span>
                      {item.notes && (
                        <p className="text-[10px] text-zinc-500 italic">Note: {item.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {currencySymbol}
                    {item.totalPrice}
                  </span>
                </div>
              ))}

              {/* Total Calculation */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol}
                    {order.subtotal}
                  </span>
                </div>
                {Number(order.tax) > 0 && (
                  <div className="flex justify-between text-zinc-500">
                    <span>GST / Tax</span>
                    <span>
                      {currencySymbol}
                      {order.tax}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-zinc-900 dark:text-zinc-100 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Total Due</span>
                  <span>
                    {currencySymbol}
                    {order.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between gap-3">
          <button
            onClick={() => loadStatus(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Update Status</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOrderAgain();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Order More
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--sf-primary, #ea580c)',
                color: 'var(--sf-primary-contrast, #ffffff)',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

