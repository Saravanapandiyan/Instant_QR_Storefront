import React from 'react';
import { Bell, Utensils, ShoppingBag, X, ChefHat, VolumeX } from 'lucide-react';
import type { Order } from '../api/ordersApi';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

interface NewOrderAlertModalProps {
  order: Order | null;
  onSilence: () => void;
  onAccept: (order: Order) => void;
}

export const NewOrderAlertModal: React.FC<NewOrderAlertModalProps> = ({
  order,
  onSilence,
  onAccept,
}) => {
  const { formatPrice } = useCurrencyStore();

  if (!order) return null;

  return (
    <aside
      aria-label="New incoming order alert"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-md bg-surface border-2 border-primary rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all animate-in slide-in-from-top-4 fade-in duration-300 ring-4 ring-primary/20"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Banner with Alert Beacon */}
      <div className="bg-primary text-on-primary px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
            <Bell className="w-4 h-4 text-on-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
              <h3 className="text-sm font-black tracking-wide uppercase truncate">
                New Order #{order.orderNumber}
              </h3>
            </div>
            <p className="text-[11px] text-on-primary/80 font-medium truncate">
              {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 text-on-primary font-bold text-xs">
            {order.orderType === 'DINE_IN' ? (
              <>
                <Utensils className="w-3 h-3" />
                <span>Table {order.tableNumber || '-'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3" />
                <span>Takeaway</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onSilence}
            className="p-1.5 rounded-lg text-on-primary hover:bg-white/20 transition-colors cursor-pointer"
            title="Silence / Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Dishes Breakdown & Total */}
      <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
        {/* Dishes list */}
        <div className="rounded-xl border border-border bg-surface-2/50 divide-y divide-border/60 overflow-hidden text-xs">
          {order.items.map((item) => (
            <div key={item.id} className="p-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 pr-2">
                <span className="font-mono font-black text-primary mr-1.5">
                  {item.quantity}×
                </span>
                <span className="font-bold text-text">{item.productName}</span>
                {item.notes && (
                  <p className="text-[10px] text-muted italic mt-0.5">
                    Note: "{item.notes}"
                  </p>
                )}
              </div>
              <span className="font-semibold text-text shrink-0 text-xs font-mono">
                {formatPrice(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        {/* Customer note if any */}
        {order.orderNotes && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
            <span className="font-bold">Instructions: </span>
            <span className="italic">"{order.orderNotes}"</span>
          </div>
        )}

        {/* Bill Total */}
        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-xs font-bold text-muted uppercase">Bill Total Due</span>
          <span className="text-base font-black text-text font-mono">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-surface-2 border-t border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSilence}
          className="px-3 py-2 rounded-xl text-xs font-bold text-muted hover:text-text hover:bg-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Silence</span>
        </button>

        <button
          type="button"
          onClick={() => onAccept(order)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Accept & Set Prep Time</span>
        </button>
      </div>
    </aside>
  );
};
