import React from 'react';
import {
  X,
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Receipt,
  UtensilsCrossed,
} from 'lucide-react';
import type { StoredCustomerOrder } from './useCustomerOrders';

interface MyOrdersModalProps {
  orders: StoredCustomerOrder[];
  currencySymbol: string;
  onClose: () => void;
  onSelectOrder: (orderId: string) => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  orders,
  currencySymbol,
  onClose,
  onSelectOrder,
}) => {
  const getStatusBadge = (status: StoredCustomerOrder['status']) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Order Placed</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
            <ChefHat className="w-3 h-3 animate-pulse" />
            <span>Kitchen Preparing</span>
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Bell className="w-3 h-3 animate-bounce" />
            <span>Ready to Serve!</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatOrderTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full sm:max-w-md max-h-[85vh] sm:rounded-3xl rounded-t-3xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          backgroundColor: 'var(--sf-surface)',
          borderColor: 'var(--sf-border)',
          color: 'var(--sf-text)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--sf-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: 'var(--sf-primary)' }}
            >
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">My Orders</h3>
              <p className="text-[11px] opacity-70">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed this session
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center opacity-30"
                style={{ backgroundColor: 'var(--sf-surface-2, rgba(0,0,0,0.05))' }}
              >
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm">No Orders Yet</h4>
              <p className="text-xs opacity-70 max-w-xs mx-auto">
                Select dishes from the menu to place an order. Your active and previous orders will appear here for live tracking.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isActive =
                order.status === 'PENDING' ||
                order.status === 'CONFIRMED' ||
                order.status === 'PREPARING' ||
                order.status === 'READY';

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] relative overflow-hidden ${
                    isActive ? 'border-primary ring-1 ring-primary/20' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--sf-surface)',
                    borderColor: isActive ? 'var(--sf-primary)' : 'var(--sf-border)',
                  }}
                >
                  {/* Top Bar: Order Number & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm tracking-tight">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {formatOrderTime(order.createdAt)}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Order Type & Items info */}
                  <div className="space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center gap-2 text-[11px] opacity-75">
                      <span className="font-semibold">
                        {order.orderType === 'DINE_IN'
                          ? `Table ${order.tableNumber || '-'}`
                          : 'Takeaway / Pickup'}
                      </span>
                      <span>•</span>
                      <span>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
                    </div>

                    <p className="text-xs font-medium opacity-90 line-clamp-1">
                      {order.itemSummary}
                    </p>
                  </div>

                  {/* Bottom Row: Total & Action button */}
                  <div
                    className="pt-2.5 border-t flex items-center justify-between text-xs"
                    style={{ borderColor: 'var(--sf-border)' }}
                  >
                    <div>
                      <span className="text-[10px] opacity-65 block leading-none">Total Bill</span>
                      <span className="font-black text-sm">
                        {currencySymbol}
                        {order.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                      style={{
                        backgroundColor: isActive
                          ? 'var(--sf-primary)'
                          : 'var(--sf-surface-2, rgba(0,0,0,0.05))',
                        color: isActive
                          ? 'var(--sf-primary-contrast, #ffffff)'
                          : 'var(--sf-text)',
                      }}
                    >
                      <span>{isActive ? 'Track Live' : 'View Bill'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3 border-t text-center text-[11px] opacity-60"
          style={{ borderColor: 'var(--sf-border)' }}
        >
          Orders placed on this device are automatically tracked in real-time.
        </div>
      </div>
    </div>
  );
};

