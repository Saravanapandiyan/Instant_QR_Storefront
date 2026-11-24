import React, { useState } from 'react';
import { ChefHat, Clock, Sparkles, X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Order } from '../api/ordersApi';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

interface PrepTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (orderId: string, prepTimeMinutes: number) => Promise<void>;
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

  if (!isOpen || !order) return null;

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
    await onConfirm(order.id, finalMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
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
                Confirm Order (Order #{order.orderNumber})
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

        {/* 1 Credit & Payment Notice */}
        <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-2.5 text-xs text-text">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Order will be marked Paid (Cash Collected)</span> and 1 Credit will be deducted from your restaurant wallet.
          </div>
        </div>

        {/* Preparation Time Selection */}
        <div className="space-y-3">
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
          <div className="pt-1">
            <div
              onClick={() => setIsCustom(true)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors cursor-pointer ${
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
                className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <span className="text-xs text-muted">minutes</span>
            </div>
          </div>

          <p className="text-[11px] text-muted italic">
            This duration will start a live countdown on the customer's phone and kitchen screen.
          </p>
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
            <span>Confirm Order ({isCustom ? customMinutes || '15' : selectedMinutes}m)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
