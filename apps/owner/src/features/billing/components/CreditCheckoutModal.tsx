import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Zap,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Coins,
  ArrowRight,
} from 'lucide-react';
import type { DynamicPack } from '../api/packsApi';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { creditsApi, type PurchasePackResponse } from '../api/creditsApi';

interface CreditCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: DynamicPack | null;
  restaurantId: string;
  restaurantName: string;
  currency: 'INR' | 'USD';
  onSuccess: (res: PurchasePackResponse) => void;
}

export const CreditCheckoutModal: React.FC<CreditCheckoutModalProps> = ({
  isOpen,
  onClose,
  pack,
  restaurantId,
  restaurantName,
  currency,
  onSuccess,
}) => {
  useBodyScrollLock(isOpen);
  const [paymentMethod] = useState<'STRIPE'>('STRIPE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchasePackResponse | null>(null);

  if (!isOpen || !pack) return null;

  const totalCredits = pack.ordersCount + (pack.bonusCredits || 0);
  const price = currency === 'USD' ? Number(pack.priceUsd) : Number(pack.priceInr);
  const currencySymbol = currency === 'USD' ? '$' : '₹';
  const costPerOrder = (price / totalCredits).toFixed(2);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await creditsApi.createCheckoutSession({
        restaurantId,
        packId: pack.id,
        currency,
      });

      if (response?.checkoutUrl) {
        // Redirect browser to Stripe Checkout hosted payment page
        window.location.href = response.checkoutUrl;
        return;
      }

      throw new Error('No checkout URL received from Stripe gateway.');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err?.response?.data?.message || err?.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text leading-tight">
                {result ? 'Top-Up Successful!' : 'Order Credit Recharge'}
              </h3>
              <p className="text-xs text-muted font-medium mt-0.5">
                {restaurantName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={result ? handleDone : onClose}
            className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {result ? (
            /* Success View */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h4 className="text-xl font-black text-text">
                  +{result.creditsAdded.toLocaleString()} Credits Added!
                </h4>
                <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                  Your prepaid balance has been credited. You can now accept incoming orders with zero interruption.
                </p>
              </div>

              {/* Transaction Receipt Card */}
              <div className="p-4 rounded-2xl bg-surface-2/60 border border-border text-left space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Pack Purchased:</span>
                  <span className="font-bold text-text">{result.packName}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>New Credit Balance:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {result.newBalance.toLocaleString()} Credits
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Payment Method:</span>
                  <span className="font-semibold text-text uppercase">{result.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-muted pt-1 border-t border-border">
                  <span>Transaction Ref:</span>
                  <span className="font-mono text-[11px] text-text">{result.invoiceRef}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDone}
                className="w-full py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-on-primary shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            /* Checkout View */
            <>
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Pack Overview Card */}
              <div className="p-4 rounded-2xl bg-surface-2/70 border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    Selected Pack
                  </span>
                  <h4 className="text-lg font-black text-text tracking-tight">
                    {pack.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-text">
                      {pack.ordersCount.toLocaleString()} orders
                    </span>
                    {pack.bonusCredits > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                        +{pack.bonusCredits.toLocaleString()} FREE bonus
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-text tracking-tight">
                    {currencySymbol}{price}
                  </span>
                  <p className="text-[10px] text-muted font-medium">
                    ~{currencySymbol}{costPerOrder} / order
                  </p>
                </div>
              </div>

              {/* Payment Method - Stripe Only */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider block">
                  Payment Method
                </label>

                {/* Stripe */}
                <div className="p-4 rounded-2xl border-2 border-primary bg-primary/5 ring-2 ring-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text flex items-center gap-2">
                        <span>Pay via Stripe</span>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase tracking-wider">
                          Official Gateway
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        Credit / Debit Card (Visa, Mastercard, RuPay), Apple Pay & Google Pay
                      </p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-primary bg-primary text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Guarantees & Summary */}
              <div className="p-3.5 rounded-2xl bg-surface-2/40 border border-border/80 flex items-center gap-2.5 text-muted text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prepaid pay-per-order. Credits never expire. No monthly subscriptions.</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-on-primary shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Recharge...</span>
                  </>
                ) : (
                  <>
                    <span>Pay {currencySymbol}{price} via Stripe & Top Up {totalCredits.toLocaleString()} Credits</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
