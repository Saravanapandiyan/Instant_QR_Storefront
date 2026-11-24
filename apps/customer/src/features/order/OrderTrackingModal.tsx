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
  Receipt,
  Sparkles,
  Flame,
  Bell,
  Smartphone,
} from 'lucide-react';
import { fetchOrderDetails } from '../../api/ordersApi';
import type { PlacedOrder } from '../../api/ordersApi';
import { CustomerReceiptModal } from './CustomerReceiptModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  notifyCustomerOrderReady,
  playOrderReadyChime,
  requestNotificationPermission,
} from '../../utils/customerAudio';

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
  useBodyScrollLock(Boolean(orderId));
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Second tick for smooth countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStatus = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await fetchOrderDetails(orderId);
      setOrder(data);
      onStatusUpdate?.(data);

      // Play audio chime and trigger vibration if order is ready
      if (data.status === 'READY') {
        notifyCustomerOrderReady({
          orderId: data.id,
          orderNumber: data.orderNumber,
          orderType: data.orderType,
          tableNumber: data.tableNumber,
          restaurantName: data.restaurant?.name,
        });
      }
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
  const isUpi = order.paymentMethod === 'UPI';

  // Preparation countdown calculation
  const prepStartedMs = order.prepStartedAt
    ? new Date(order.prepStartedAt).getTime()
    : new Date(order.createdAt).getTime();
  const prepTargetMs = order.estimatedReadyAt
    ? new Date(order.estimatedReadyAt).getTime()
    : prepStartedMs + (order.prepTimeMinutes || 15) * 60 * 1000;
  const remainingSec = Math.max(0, Math.floor((prepTargetMs - now) / 1000));
  const remainingMin = Math.floor(remainingSec / 60);
  const remainingSecMod = remainingSec % 60;
  const prepRemainingText =
    remainingSec > 0
      ? `~${remainingMin}:${String(remainingSecMod).padStart(2, '0')} mins left`
      : 'Finishing touches...';
  const totalPrepSec = Math.max(1, Math.floor((prepTargetMs - prepStartedMs) / 1000));
  const elapsedSec = Math.max(0, Math.floor((now - prepStartedMs) / 1000));
  const prepProgressPct = Math.min(
    100,
    Math.max(5, Math.round((elapsedSec / totalPrepSec) * 100)),
  );

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="View & Print Digital Receipt"
            >
              <Receipt className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Digital</span> Receipt
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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

          {/* Live Kitchen Preparation Countdown Banner */}
          {order.status === 'PREPARING' && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600 animate-bounce" />
                  <span className="text-xs font-bold text-orange-950 dark:text-orange-200">
                    Chef is Cooking Fresh
                  </span>
                </div>
                <span className="text-xs font-black text-orange-600 dark:text-orange-400 font-mono">
                  {prepRemainingText}
                </span>
              </div>

              {/* Running Progress Bar */}
              <div className="w-full h-2 rounded-full bg-orange-100 dark:bg-orange-900/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${prepProgressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-orange-800/80 dark:text-orange-300/80">
                <span>
                  Prep started:{' '}
                  {order.prepStartedAt
                    ? new Date(order.prepStartedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now'}
                </span>
                {order.estimatedReadyAt && (
                  <span>
                    Target:{' '}
                    {new Date(order.estimatedReadyAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {/* Sound Alert Status Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-orange-900/40 text-[10px] text-orange-800/90 dark:text-orange-300/90">
                <span className="flex items-center gap-1 font-semibold">
                  <Bell className="w-3 h-3 text-orange-600 animate-pulse" />
                  Device will ring & vibrate when food is ready
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playOrderReadyChime();
                    requestNotificationPermission().catch(() => {});
                  }}
                  className="font-bold underline hover:text-orange-950 dark:hover:text-orange-100 cursor-pointer"
                >
                  Test Sound
                </button>
              </div>
            </div>
          )}

          {/* Order Ready Alert with Melodic Sound & Vibration */}
          {order.status === 'READY' && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-tight">
                  🎉 Your Order is Ready!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {order.orderType === 'DINE_IN'
                    ? `Hot food is being served to Table ${order.tableNumber || '-'}!`
                    : 'Please collect your takeaway order from the pickup counter.'}
                </p>
              </div>
            </div>
          )}

          {/* Payment Status Callout */}
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
                {isUpi ? <Smartphone className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
              </div>
              <div>
                <h4
                  className={`font-bold text-xs sm:text-sm ${
                    isPaid
                      ? 'text-emerald-900 dark:text-emerald-200'
                      : 'text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {isPaid
                    ? (isUpi ? 'UPI Payment Confirmed' : 'Payment Confirmed')
                    : (isUpi ? 'Pay via UPI' : 'Pay Cash at Counter')}
                </h4>
                <p
                  className={`text-xs mt-0.5 ${
                    isPaid
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isPaid
                    ? (isUpi
                        ? 'Payment received & verified by restaurant. Thank you!'
                        : 'Cash received by cashier. Thank you!')
                    : (isUpi
                        ? `Please complete payment of ${currencySymbol}${order.totalAmount} via UPI. Restaurant will verify once received.`
                        : `Please pay ${currencySymbol}${order.totalAmount} in cash at the cashier desk.`)}
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
              {isPaid ? 'Paid' : (isUpi ? 'Pending Payment' : 'Pending Cash')}
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
              type="button"
              onClick={() => setShowReceipt(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Receipt className="w-3.5 h-3.5 text-orange-600" />
              <span>Print Receipt</span>
            </button>
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

      {/* Customer Printable Digital Receipt Modal */}
      <CustomerReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={order}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

