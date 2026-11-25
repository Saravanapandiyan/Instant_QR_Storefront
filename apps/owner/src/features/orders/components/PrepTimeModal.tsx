import React, { useState } from 'react';
import { ChefHat, Clock, Sparkles, X, Banknote, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Order } from '../api/ordersApi';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

interface PrepTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (orderId: string, prepTimeMinutes: number, paymentStatus?: string) => Promise<void>;
  isSubmitting: boolean;
}

const PRESET_TIMES = [10, 15, 20, 30, 45];

export const PrepTimeModal: React.FC<PrepTimeModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirm,
  isSubmitting,
}) => {
  const { formatPrice } = useCurrencyStore();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');

  React.useEffect(() => {
    if (order) {
      // Default should always be 'PAID' (Cash Received / UPI Verified) as requested
      setPaymentStatus('PAID');
    }
  }, [order?.id]);

  if (!isOpen || !order) return null;

  const isUpi = order.paymentMethod === 'UPI';

  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setIsCustom(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomMinutes(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedMinutes(parsed);
    }
  };

  const handleSubmit = async () => {
    const finalMinutes = isCustom
      ? Math.max(1, parseInt(customMinutes, 10) || 15)
      : selectedMinutes;
    await onConfirm(order.id, finalMinutes, paymentStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                Accept Order #{order.orderNumber}
              </h3>
              <p className="text-xs text-muted">
                {order.orderType === 'DINE_IN'
                  ? `Table ${order.tableNumber || '-'}`
                  : 'Takeaway'} &bull; {order.customerName} &bull; <span className="font-bold text-text">{formatPrice(order.totalAmount)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Verification Selector */}
        <div className="p-3.5 rounded-2xl bg-surface-2 border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-text">
            <div className="flex items-center gap-1.5">
              {isUpi ? (
                <Smartphone className="w-4 h-4 text-indigo-500" />
              ) : (
                <Banknote className="w-4 h-4 text-emerald-500" />
              )}
              <span>Customer Payment Mode: {isUpi ? 'UPI Online' : 'Cash on Counter'}</span>
            </div>
            <span className="font-extrabold text-primary">{formatPrice(order.totalAmount)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPaymentStatus('PAID')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                paymentStatus === 'PAID'
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border-border bg-surface text-muted hover:text-text'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${paymentStatus === 'PAID' ? 'text-emerald-500' : 'opacity-40'}`} />
              <div className="min-w-0">
                <div className="truncate">{isUpi ? 'UPI Verified' : 'Cash Received'}</div>
                <div className="text-[10px] font-normal opacity-80">{isUpi ? 'Soundbox / App alert' : 'Collected in register'}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentStatus('PENDING')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                paymentStatus === 'PENDING'
                  ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold'
                  : 'border-border bg-surface text-muted hover:text-text'
              }`}
            >
              <Clock className={`w-4 h-4 shrink-0 ${paymentStatus === 'PENDING' ? 'text-amber-500' : 'opacity-40'}`} />
              <div className="min-w-0">
                <div className="truncate">Mark Pending</div>
                <div className="text-[10px] font-normal opacity-80">Collect at table/serving</div>
              </div>
            </button>
          </div>
        </div>

        {/* 1 Credit Notice */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs text-text">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>Accepting this order deducts <strong>1 order credit</strong> from your restaurant balance.</span>
        </div>

        {/* Preparation Time Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-text flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted" />
            <span>Select Kitchen Prep Duration</span>
          </label>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {PRESET_TIMES.map((mins) => {
              const isSelected = !isCustom && selectedMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectPreset(mins)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-2 border-border text-text hover:bg-border'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>

          {/* Custom Minutes Input */}
          <div className="pt-0.5">
            <div
              onClick={() => setIsCustom(true)}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer ${
                isCustom
                  ? 'border-primary ring-1 ring-primary/20 bg-surface'
                  : 'border-border bg-surface-2 text-muted hover:text-text'
              }`}
            >
              <input
                type="radio"
                name="prepType"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="accent-primary"
              />
              <span className="text-xs font-semibold text-text">Custom duration:</span>
              <input
                type="number"
                min="1"
                max="180"
                placeholder="25"
                disabled={!isCustom}
                value={customMinutes}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-16 px-2 py-0.5 bg-surface border border-border rounded-lg text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <span className="text-xs text-muted">minutes</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="flex items-center gap-1.5 shadow-xs"
          >
            <ChefHat className="w-4 h-4" />
            <span>Accept & Send to Kitchen ({isCustom ? customMinutes || '15' : selectedMinutes}m)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
