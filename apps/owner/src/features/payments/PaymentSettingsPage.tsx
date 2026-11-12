import React, { useState, useEffect } from 'react';
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Save,
  Lock,
  Receipt,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { usePermissions } from '../../hooks/usePermissions';
import { paymentsApi } from './api/paymentsApi';
import { toast } from '../../components/ui';

export const PaymentSettingsPage: React.FC = () => {
  const { restaurants } = useRestaurants();
  const { branches } = useBranches();
  const { can, isOwner } = usePermissions();
  const canManagePayments = isOwner || can('payments', 'manage');

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [enableCash, setEnableCash] = useState<boolean>(true);
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
          setEnableTax(Boolean(data.enableTax));
          setTaxRate(typeof data.taxRate === 'number' ? data.taxRate : 0);
          setGstNumber(data.gstNumber || '');
        }
      })
      .catch((err) => {
        console.error('Failed to load payment settings', err);
        if (active) {
          setEnableCash(true);
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

  const handleSave = async () => {
    if (!selectedRestaurantId) return;
    setIsSaving(true);
    try {
      await paymentsApi.updatePaymentSettings(selectedRestaurantId, {
        enableCash,
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

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  return (
    <DashboardLayout
      branchCount={branches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Payment Settings</h1>
            <p className="text-sm text-muted mt-1">
              Configure how customers settle bills when ordering through your QR storefront.
            </p>
          </div>

          {/* Restaurant Selector */}
          {restaurants.length > 1 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted" />
              <select
                aria-label="Select Restaurant"
                className="bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
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
          )}
        </div>

        {/* Read-Only Notice for Restricted Staff */}
        {!canManagePayments && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/25 text-warning flex items-center gap-3 text-xs">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-bold">View-Only Access:</span> You can view payment methods and tax configurations, but only restaurant administrators can modify them.
            </div>
          </div>
        )}

        {/* Selected Restaurant Banner */}
        {selectedRestaurant && (
          <div className="flex items-center justify-between p-3.5 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-2 text-text flex items-center justify-center font-bold text-sm">
                {selectedRestaurant.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-text">{selectedRestaurant.name}</div>
                <div className="text-xs text-muted">Slug: /r/{selectedRestaurant.slug}</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Storefront Active
            </span>
          </div>
        )}

        {/* Payment Methods Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-text">Accepted Payment Methods</h2>

          {/* 1. Cash on Counter (Active) */}
          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm space-y-4 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-base text-text">Cash on Counter</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                      Primary Method
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    Allow diners to place orders directly from their smartphone and pay cash
                    physically at the restaurant billing desk or cashier counter.
                  </p>
                </div>
              </div>

              {/* Theme-compliant Toggle Switch */}
              <label className={`relative inline-flex items-center flex-shrink-0 ${canManagePayments ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableCash}
                  onChange={(e) => canManagePayments && setEnableCash(e.target.checked)}
                  disabled={!canManagePayments || isLoadingSettings || isSaving}
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span className="flex items-center gap-1.5 text-success font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Zero transaction fees • Instant order fulfillment
              </span>
              <span>
                Status:{' '}
                <strong className={enableCash ? 'text-success' : 'text-danger'}>
                  {enableCash ? 'Enabled' : 'Disabled'}
                </strong>
              </span>
            </div>
          </div>

          {/* 2. Stripe Online Payments (Disabled / Will be enabled soon) */}
          <div className="p-6 bg-surface/60 border border-dashed border-border rounded-2xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-2 text-muted flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-semibold text-base text-text">Stripe Online Payments</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Will be enabled soon
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    Accept Credit/Debit cards, UPI, Google Pay, Apple Pay directly on the QR
                    storefront with instant automated settlements.
                  </p>
                </div>
              </div>

              {/* Disabled toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted hidden sm:inline-block">Disabled</span>
                <div className="w-11 h-6 bg-border/60 rounded-full cursor-not-allowed opacity-50 relative">
                  <div className="absolute top-[2px] left-[2px] bg-surface rounded-full h-5 w-5 shadow-sm" />
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="mt-4 p-3.5 bg-warning/5 border border-warning/20 rounded-xl flex items-start gap-3 text-xs text-warning">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Stripe Payment Gateway Integration Pending</p>
                <p className="opacity-90 mt-0.5">
                  Direct online payments will be activated in an upcoming update. Your storefront
                  currently processes all orders smoothly via Cash on Counter.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Taxes & GST Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">Taxes & GST Configuration</h2>
              <p className="text-xs text-muted mt-0.5">
                Configure GST / Tax applied to customer checkout bills.
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-2 text-muted">
              {enableTax && taxRate > 0 ? `${taxRate}% GST Active` : 'All-Inclusive (0% GST)'}
            </span>
          </div>

          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm space-y-5">
            {/* Toggle Enable Tax */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-base text-text">Enable Order Tax / GST</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        enableTax ? 'bg-success/10 text-success' : 'bg-surface-2 text-muted'
                      }`}
                    >
                      {enableTax ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    When disabled, menu prices are 100% all-inclusive and no extra GST is charged to customers.
                  </p>
                </div>
              </div>

              {/* Theme-compliant Toggle Switch */}
              <label className={`relative inline-flex items-center flex-shrink-0 ${canManagePayments ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableTax}
                  onChange={(e) => {
                    if (!canManagePayments) return;
                    const checked = e.target.checked;
                    setEnableTax(checked);
                    if (checked && taxRate === 0) {
                      setTaxRate(5);
                    }
                  }}
                  disabled={!canManagePayments || isLoadingSettings || isSaving}
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Tax Details Inputs (Only when enabled) */}
            {enableTax ? (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tax Percentage */}
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
                        disabled={!canManagePayments || isLoadingSettings || isSaving}
                        className={`w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-sm text-text font-semibold focus:outline-none focus:ring-1 focus:ring-primary ${!canManagePayments ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="5"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-muted font-bold">%</span>
                    </div>

                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-muted">Quick presets:</span>
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => canManagePayments && setTaxRate(rate)}
                          disabled={!canManagePayments || isLoadingSettings || isSaving}
                          className={`px-2 py-0.5 text-[11px] rounded-lg font-medium border transition-colors ${
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

                  {/* GSTIN / Tax Identification */}
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1.5">
                      GSTIN / Tax ID Number <span className="text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => canManagePayments && setGstNumber(e.target.value.toUpperCase())}
                      disabled={!canManagePayments || isLoadingSettings || isSaving}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      maxLength={20}
                      className={`w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-sm text-text font-medium uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-primary ${!canManagePayments ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <p className="text-[11px] text-muted mt-1.5">
                      Printed on customer order bills and receipts.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-surface-2 border border-border rounded-xl text-xs text-muted flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    Diners will see <strong>{taxRate}% GST / Tax</strong> itemized separately under Subtotal in their checkout drawer.
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5 text-muted">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Menu prices are all-inclusive • No additional GST will be added at checkout
                </span>
                <span className="text-success font-semibold">0% GST (Disabled)</span>
              </div>
            )}
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" />
            {canManagePayments
              ? 'Changes take effect immediately on your customer QR menus.'
              : 'Viewing active restaurant payment configurations in read-only mode.'}
          </div>
          {canManagePayments ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isLoadingSettings || isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-surface-2 border border-border text-xs font-semibold text-muted flex items-center gap-1.5">
              <Lock size={14} />
              <span>Read-Only Mode</span>
            </span>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
