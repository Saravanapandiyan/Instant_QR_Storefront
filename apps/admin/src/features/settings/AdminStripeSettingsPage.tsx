import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key,
  ShieldCheck,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Coins,
  Zap,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { adminSettingsApi, type StripeAdminConfig } from '../../api/adminSettingsApi.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

export function AdminStripeSettingsPage() {
  const queryClient = useQueryClient();

  const { data: initialData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-stripe-settings'],
    queryFn: adminSettingsApi.getStripeConfig,
  });

  const [form, setForm] = useState<StripeAdminConfig>({
    mode: 'test',
    testPublishableKey: '',
    testSecretKey: '',
    livePublishableKey: '',
    liveSecretKey: '',
    defaultCurrency: 'USD',
    platformFeePercentage: 0,
    isActive: true,
  });

  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);

  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    currency?: string;
  } | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<StripeAdminConfig>) =>
      adminSettingsApi.updateStripeConfig(data),
    onSuccess: (updated) => {
      toast.success('Stripe gateway settings updated successfully!');
      queryClient.setQueryData(['admin-stripe-settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-stripe-settings'] });
      setTestResult(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update Stripe configuration.');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => adminSettingsApi.testStripeConnection(),
    onSuccess: (data) => {
      setTestResult({
        tested: true,
        success: data.success,
        message: data.message,
        currency: data.currency,
      });
      if (data.success) {
        toast.success(data.message || 'Stripe connection verified successfully!');
      } else {
        toast.error(data.message || 'Stripe connection test failed.');
      }
    },
    onError: (err: any) => {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Stripe connection failed. Verify your secret keys.',
      });
      toast.error(err.message || 'Stripe connection failed.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-20">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Stripe Gateway Settings"
          description="Manage platform-wide Stripe API credentials, test connection health, and customize commission fees."
        >
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              form.mode === 'live'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}
          >
            {form.mode === 'live' ? '● PRODUCTION LIVE' : '○ TEST SANDBOX'}
          </span>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
            title="Refresh from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            type="button"
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${testConnectionMutation.isPending ? 'animate-bounce' : ''}`} />
            {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveMutation.isPending || isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-opacity cursor-pointer text-white"
            style={{
              backgroundColor: 'var(--adm-primary)',
              opacity: saveMutation.isPending ? 0.7 : 1,
            }}
          >
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </AdminPageHeader>

        {/* Test Connection Banner if run */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-fade-in ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/30 text-rose-800 dark:text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold">
                {testResult.success
                  ? `Stripe API Verified [${form.mode.toUpperCase()} MODE]`
                  : 'Stripe API Authentication Failed'}
              </div>
              <p className="mt-0.5 opacity-90">{testResult.message}</p>
              {testResult.currency && (
                <div className="mt-1 font-mono text-[11px] opacity-80">
                  Account Default Currency: {testResult.currency.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Active Mode & Status Card */}
          <div
            className="p-5 rounded-xl border shadow-xs space-y-4"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Operating Environment
                </h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-neutral-700 dark:text-neutral-300">
                  Stripe Gateway Enabled
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, mode: 'test' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  form.mode === 'test'
                    ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Test Mode (Sandbox)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    pk_test_...
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Simulate transactions without moving real currency. Ideal for onboarding and verification.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, mode: 'live' })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  form.mode === 'live'
                    ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Live Mode (Production)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    pk_live_...
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Real credit/debit card processing and live bank payouts. Only use with valid PCI credentials.
                </p>
              </button>
            </div>
          </div>

          {/* Test Mode Credentials */}
          <div
            className={`p-5 rounded-xl border shadow-xs space-y-4 ${
              form.mode === 'test' ? 'ring-1 ring-amber-500/30' : 'opacity-70'
            }`}
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Test Credentials (Sandbox)
                </h2>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Stripe Developers &gt; API keys</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Test Publishable Key
                </label>
                <input
                  type="text"
                  placeholder="pk_test_51..."
                  value={form.testPublishableKey}
                  onChange={(e) => setForm({ ...form, testPublishableKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    Test Secret Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTestSecret(!showTestSecret)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showTestSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showTestSecret ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <input
                  type={showTestSecret ? 'text' : 'password'}
                  placeholder="sk_test_51..."
                  value={form.testSecretKey}
                  onChange={(e) => setForm({ ...form, testSecretKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>
            </div>
          </div>

          {/* Live Mode Credentials */}
          <div
            className={`p-5 rounded-xl border shadow-xs space-y-4 ${
              form.mode === 'live' ? 'ring-1 ring-emerald-500/30' : 'opacity-70'
            }`}
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Live Credentials (Production)
                </h2>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Live PCI Compliant</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Live Publishable Key
                </label>
                <input
                  type="text"
                  placeholder="pk_live_51..."
                  value={form.livePublishableKey}
                  onChange={(e) => setForm({ ...form, livePublishableKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" />
                    Live Secret Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLiveSecret(!showLiveSecret)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showLiveSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showLiveSecret ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <input
                  type={showLiveSecret ? 'text' : 'password'}
                  placeholder="sk_live_51..."
                  value={form.liveSecretKey}
                  onChange={(e) => setForm({ ...form, liveSecretKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>
            </div>
          </div>

          {/* Currency Platform Settings */}
          <div
            className="p-5 rounded-xl border shadow-xs space-y-4"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <Coins className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Platform Default Currency
              </h2>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Settlement &amp; Storefront Default Currency
              </label>
              <select
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
                style={{
                  backgroundColor: 'var(--adm-surface)',
                  borderColor: 'var(--adm-border)',
                  color: 'var(--adm-text)',
                }}
              >
                <option value="USD" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>USD ($) - United States Dollar</option>
                <option value="INR" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>INR (₹) - Indian Rupee</option>
                <option value="EUR" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>EUR (€) - Euro</option>
                <option value="GBP" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>GBP (£) - British Pound</option>
                <option value="AED" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>AED (د.إ) - UAE Dirham</option>
                <option value="AUD" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>AUD (A$) - Australian Dollar</option>
                <option value="CAD" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>CAD (C$) - Canadian Dollar</option>
                <option value="SGD" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>SGD (S$) - Singapore Dollar</option>
              </select>
              <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                Default currency used when a restaurant or tenant has not configured their local currency code.
              </p>
            </div>
          </div>

          {/* Submit bar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending || isLoading}
              className="px-6 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm text-white cursor-pointer transition-opacity"
              style={{
                backgroundColor: 'var(--adm-primary)',
                opacity: saveMutation.isPending ? 0.7 : 1,
              }}
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Stripe Configuration'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
