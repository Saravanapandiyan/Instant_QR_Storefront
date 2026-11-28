import React, { useState, useEffect } from 'react';
import {
  Banknote,
  QrCode,
  Smartphone,
  ShieldCheck,
  Building2,
  Save,
  Lock,
  Receipt,
  Sparkles,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, toast } from '../../components/ui';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { usePermissions } from '../../hooks/usePermissions';
import { paymentsApi } from './api/paymentsApi';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
  canManage: boolean;
  ariaLabel: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled,
  canManage,
  ariaLabel,
}) => (
  <label
    className={`relative inline-flex items-center shrink-0 ${
      canManage ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
    }`}
  >
    <input
      type="checkbox"
      aria-label={ariaLabel}
      className="sr-only peer"
      checked={checked}
      onChange={(e) => canManage && onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="w-10 h-5.5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary" />
  </label>
);

export const PaymentSettingsPage: React.FC = () => {
  const { restaurants } = useRestaurants();
  const { branches } = useBranches();
  const { can, isOwner } = usePermissions();
  const canManagePayments = isOwner || can('payments', 'manage');

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [enableCash, setEnableCash] = useState<boolean>(true);
  const [enableUpi, setEnableUpi] = useState<boolean>(false);
  const [upiId, setUpiId] = useState<string>('');
  const [upiName, setUpiName] = useState<string>('');
  const [enableTax, setEnableTax] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [gstNumber, setGstNumber] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);

  // Auto-select first restaurant
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Fetch settings when restaurant changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    let active = true;
    setIsLoadingSettings(true);

    paymentsApi
      .getPaymentSettings(selectedRestaurantId)
      .then((data) => {
        if (active) {
          setEnableCash(data.enableCash);
          setEnableUpi(Boolean(data.enableUpi));
          setUpiId(data.upiId || '');
          setUpiName(data.upiName || '');
          setEnableTax(Boolean(data.enableTax));
          setTaxRate(typeof data.taxRate === 'number' ? data.taxRate : 0);
          setGstNumber(data.gstNumber || '');
        }
      })
      .catch((err) => {
        console.error('Failed to load payment settings', err);
        if (active) {
          setEnableCash(true);
          setEnableUpi(false);
          setUpiId('');
          setUpiName('');
          setEnableTax(false);
          setTaxRate(0);
          setGstNumber('');
        }
      })
      .finally(() => {
        if (active) setIsLoadingSettings(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRestaurantId]);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
  const controlsDisabled = !canManagePayments || isLoadingSettings || isSaving;

  const handleSave = async () => {
    if (!selectedRestaurantId) return;
    if (enableUpi && !upiId.trim()) {
      toast.error('Please enter a valid UPI ID (e.g. merchant@upi).', 'Validation');
      return;
    }
    setIsSaving(true);
    try {
      await paymentsApi.updatePaymentSettings(selectedRestaurantId, {
        enableCash,
        enableUpi,
        upiId: upiId.trim(),
        upiName: upiName.trim() || selectedRestaurant?.name || '',
        enableTax,
        taxRate: Number(taxRate || 0),
        gstNumber: gstNumber.trim(),
      });
      toast.success('Payment and tax settings saved successfully.', 'Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment settings.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      branchCount={branches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text flex items-center gap-2">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <span>Payment Settings</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Manage accepted checkout methods, UPI collection, and GST rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {restaurants.length > 1 ? (
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  aria-label="Select Restaurant"
                  className="bg-surface border border-border text-text rounded-xl pl-8 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                >
                  {restaurants.map((rest) => (
                    <option key={rest.id} value={rest.id} className="bg-surface text-text">
                      {rest.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : selectedRestaurant ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
                <span className="font-semibold text-text truncate max-w-[180px]">
                  {selectedRestaurant.name}
                </span>
              </div>
            ) : null}

            {canManagePayments ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isLoadingSettings || isSaving}
                icon={<Save className="w-3.5 h-3.5" />}
                className="hidden sm:inline-flex whitespace-nowrap shrink-0"
              >
                Save Changes
              </Button>
            ) : (
              <span className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs font-semibold text-muted items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Read-Only</span>
              </span>
            )}
          </div>
        </div>

        {/* Read-Only Notice for Restricted Staff */}
        {!canManagePayments && (
          <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/25 text-warning flex items-start sm:items-center gap-2.5 text-xs">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">View-Only Access:</span> You can inspect payment and tax settings, but only restaurant administrators can modify them.
            </div>
          </div>
        )}

        {/* Main Settings Sections */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                Payment Methods
              </h2>
              <span className="text-xs text-muted whitespace-nowrap">
                {[enableCash, enableUpi].filter(Boolean).length} of 2 enabled
              </span>
            </div>

            {!enableCash && !enableUpi && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Enable at least one payment method so diners can place orders.</span>
              </div>
            )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cash on Counter Tile */}
                <div
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    enableCash
                      ? 'bg-surface border-primary/40 shadow-2xs'
                      : 'bg-surface/60 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                      <Banknote className="w-4.5 h-4.5" />
                    </div>
                    <ToggleSwitch
                      checked={enableCash}
                      onChange={setEnableCash}
                      disabled={controlsDisabled}
                      canManage={canManagePayments}
                      ariaLabel="Toggle Cash on Counter"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-text">Cash on Counter</h3>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Diners order from their phone and pay cash at the billing desk.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                    <span className="text-muted">0% gateway fee</span>
                    <span className={`font-semibold ${enableCash ? 'text-success' : 'text-muted'}`}>
                      {enableCash ? 'Active' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Direct UPI Tile */}
                <div
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    enableUpi
                      ? 'bg-surface border-indigo-500/40 shadow-2xs'
                      : 'bg-surface/60 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4.5 h-4.5" />
                    </div>
                    <ToggleSwitch
                      checked={enableUpi}
                      onChange={setEnableUpi}
                      disabled={controlsDisabled}
                      canManage={canManagePayments}
                      ariaLabel="Toggle Direct UPI Payments"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-text">Direct UPI</h3>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Instant payment via GPay, PhonePe, Paytm, or desktop QR scan.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                    <span className="text-indigo-500 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Instant settlement</span>
                    </span>
                    <span
                      className={`font-semibold ${
                        enableUpi
                          ? upiId.trim()
                            ? 'text-success'
                            : 'text-amber-600 dark:text-amber-400'
                          : 'text-muted'
                      }`}
                    >
                      {enableUpi ? (upiId.trim() ? 'Ready' : 'Needs VPA') : 'Off'}
                    </span>
                  </div>
                </div>
              </div>

              {/* UPI Details Form (Expanded when Direct UPI is ON) */}
              {enableUpi && (
                <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text">UPI Receiver Details</h3>
                    <span className="text-[11px] text-muted">Direct bank settlement</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1.5">
                        Merchant UPI ID (VPA) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. restaurant@icici"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        disabled={!canManagePayments || isSaving}
                        className="w-full px-3 py-2 text-sm bg-surface-2/60 border border-border rounded-xl text-text placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text mb-1.5">
                        Payee Display Name
                      </label>
                      <input
                        type="text"
                        placeholder={selectedRestaurant?.name || 'e.g. Bucket Briyano'}
                        value={upiName}
                        onChange={(e) => setUpiName(e.target.value)}
                        disabled={!canManagePayments || isSaving}
                        className="w-full px-3 py-2 text-sm bg-surface-2/60 border border-border rounded-xl text-text placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Live Test UPI QR Preview (right after UPI inputs) */}
                  {upiId.trim() && (
                    <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center gap-3.5 bg-surface-2/40 p-3.5 rounded-xl border">
                      <div className="p-2 bg-white rounded-lg border border-neutral-200 shrink-0">
                        <QRCodeSVG
                          value={`upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(upiName.trim() || selectedRestaurant?.name || 'Restaurant')}&cu=INR`}
                          size={88}
                          level="M"
                        />
                      </div>
                      <div className="text-xs space-y-1 text-center sm:text-left min-w-0 w-full">
                        <div className="font-bold text-text flex items-center justify-center sm:justify-start gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Live Test UPI QR Preview</span>
                        </div>
                        <p className="text-muted leading-relaxed">
                          Scan with GPay, PhonePe, or Paytm to verify your UPI ID before saving.
                        </p>
                        <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold break-all sm:truncate">
                          {upiId.trim()} • {upiName.trim() || selectedRestaurant?.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Taxes & GST Configuration */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">
                  Taxes & GST
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 border border-border text-muted whitespace-nowrap">
                  {enableTax && taxRate > 0 ? `${taxRate}% GST Active` : 'All-Inclusive (0%)'}
                </span>
              </div>

              <div className="p-4 sm:p-5 bg-surface border border-border rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Receipt className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-semibold text-sm text-text">Charge Order Tax / GST</h3>
                  </div>

                  <ToggleSwitch
                    checked={enableTax}
                    onChange={(checked) => {
                      setEnableTax(checked);
                      if (checked && taxRate === 0) {
                        setTaxRate(5);
                      }
                    }}
                    disabled={controlsDisabled}
                    canManage={canManagePayments}
                    ariaLabel="Toggle Order Tax or GST"
                  />
                </div>

                <p className="text-xs text-muted leading-relaxed sm:pl-[48px]">
                  {enableTax
                    ? 'Tax is itemized separately below Subtotal at checkout.'
                    : 'Menu prices are all-inclusive with no extra tax added.'}
                </p>

                {enableTax && (
                  <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1.5">
                        GST / Tax Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={taxRate}
                          onChange={(e) => canManagePayments && setTaxRate(Number(e.target.value))}
                          disabled={controlsDisabled}
                          className={`w-full bg-surface-2/60 border border-border rounded-xl px-3.5 py-2 pr-8 text-sm text-text font-semibold focus:outline-none focus:ring-1 focus:ring-primary ${
                            !canManagePayments ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          placeholder="5"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted font-bold">%</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {[0, 5, 12, 18].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => canManagePayments && setTaxRate(rate)}
                            disabled={controlsDisabled}
                            className={`px-2.5 py-0.5 text-[11px] rounded-lg font-medium border transition-colors ${
                              taxRate === rate
                                ? 'bg-primary text-white border-primary'
                                : 'bg-surface border-border text-muted hover:text-text'
                            } ${!canManagePayments ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text mb-1.5">
                        GSTIN / Tax ID <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={(e) => canManagePayments && setGstNumber(e.target.value.toUpperCase())}
                        disabled={controlsDisabled}
                        placeholder="e.g. 33AAAAA0000A1Z5"
                        maxLength={20}
                        className={`w-full bg-surface-2/60 border border-border rounded-xl px-3.5 py-2 text-sm text-text font-medium uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-primary ${
                          !canManagePayments ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                      <p className="text-[11px] text-muted mt-1.5">
                        Displayed on customer bills and receipts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
        </div>

        {/* Sync Notice & Mobile Save Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="text-xs text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            <span>Changes sync immediately to your live QR menus.</span>
          </div>
          {canManagePayments && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isLoadingSettings || isSaving}
              icon={<Save className="w-4 h-4" />}
              className="sm:hidden w-full justify-center"
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
