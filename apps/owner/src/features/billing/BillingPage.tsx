import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Coins,
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Check,
  ArrowUpRight,
  RotateCw,
  History,
  AlertTriangle,
  Receipt,
  Building2,
  TrendingUp,
  Store,
  Crown,
  Layers,
  CheckCircle2,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useActiveStore } from '../../store/useActiveStore';
import { packsApi, type DynamicPack } from './api/packsApi';
import { creditsApi, type CreditBalanceInfo, type CreditLedgerEntry, type PurchasePackResponse } from './api/creditsApi';
import { CreditCheckoutModal } from './components/CreditCheckoutModal';
import { toast } from '../../components/ui';

// High-reliability default packs
const DEFAULT_PACKS: DynamicPack[] = [
  {
    id: 'starter',
    code: 'STARTER',
    name: 'Starter',
    ordersCount: 500,
    bonusCredits: 0,
    priceUsd: 5,
    priceInr: 149,
    isActive: true,
    sortOrder: 1,
    createdAt: '',
    updatedAt: '',
    featuresJson: { qrMenu: true, aiMenuImport: true, counterDashboard: true, liveOrderStatus: true },
  },
  {
    id: 'growth',
    code: 'GROWTH',
    name: 'Growth',
    ordersCount: 1500,
    bonusCredits: 0,
    priceUsd: 12,
    priceInr: 399,
    isActive: true,
    sortOrder: 2,
    createdAt: '',
    updatedAt: '',
    featuresJson: { qrMenu: true, aiMenuImport: true, dailyReports: true, counterDashboard: true, liveOrderStatus: true },
  },
  {
    id: 'pro',
    code: 'PRO',
    name: 'Pro',
    ordersCount: 3000,
    bonusCredits: 300,
    priceUsd: 20,
    priceInr: 699,
    isActive: true,
    sortOrder: 3,
    createdAt: '',
    updatedAt: '',
    featuresJson: { qrMenu: true, aiMenuImport: true, dailyReports: true, kitchenScreen: true, tvDisplay: true, counterDashboard: true, liveOrderStatus: true },
  },
  {
    id: 'business',
    code: 'BUSINESS',
    name: 'Business',
    ordersCount: 10000,
    bonusCredits: 1500,
    priceUsd: 50,
    priceInr: 1999,
    isActive: true,
    sortOrder: 4,
    createdAt: '',
    updatedAt: '',
    featuresJson: { qrMenu: true, aiMenuImport: true, dailyReports: true, kitchenScreen: true, tvDisplay: true, staffRoles: true, multiCounter: true, counterDashboard: true, liveOrderStatus: true },
  },
  {
    id: 'chain',
    code: 'CHAIN',
    name: 'Enterprise',
    ordersCount: 25000,
    bonusCredits: 5000,
    priceUsd: 100,
    priceInr: 4999,
    isActive: true,
    sortOrder: 5,
    createdAt: '',
    updatedAt: '',
    featuresJson: { qrMenu: true, aiMenuImport: true, dailyReports: true, kitchenScreen: true, tvDisplay: true, staffRoles: true, multiCounter: true, multiOutlets: true, prioritySupport: true, counterDashboard: true, liveOrderStatus: true },
  },
];

// Refined metadata for clean, professional cards
const PACK_DESCRIPTIONS: Record<string, string> = {
  STARTER: 'For small food stalls, cafés & pilot setups',
  GROWTH: 'For active daily counters & takeaway joints',
  PRO: 'Best value for dine-in restaurants & busy kitchens',
  BUSINESS: 'For high meal rush & multi-counter operations',
  CHAIN: 'For multi-outlet franchises & restaurant chains',
};

export const BillingPage: React.FC = () => {
  const { restaurants = [] } = useRestaurants();
  const activeRestaurantId = useActiveStore((state) => state.activeRestaurantId);
  const setActiveRestaurantId = useActiveStore((state) => state.setActiveRestaurantId);

  // Selected restaurant
  const selectedRestaurant = useMemo(() => {
    return (
      restaurants.find((r) => r.id === activeRestaurantId) ||
      restaurants[0] ||
      null
    );
  }, [restaurants, activeRestaurantId]);

  // URL-driven tabs: /billing/plans vs /billing/history
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const activeMainTab: 'plans' | 'history' = tab === 'history' ? 'history' : 'plans';

  const handleSwitchTab = (newTab: 'plans' | 'history') => {
    navigate(`/billing/${newTab}`);
  };

  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [packs, setPacks] = useState<DynamicPack[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<CreditBalanceInfo | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CreditLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedPackForCheckout, setSelectedPackForCheckout] = useState<DynamicPack | null>(null);
  const [planFilter, setPlanFilter] = useState<'ALL' | 'CORE' | 'SCALE'>('ALL');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'ORDER_CONFIRMED' | 'PACK_PURCHASE' | 'SIGNUP_BONUS'>('ALL');

  const [searchParams, setSearchParams] = useSearchParams();
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  // Handle return from Stripe Checkout (success verification or cancel notice)
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';

    if (isCanceled) {
      toast.error('Credit recharge payment was canceled.');
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (sessionId && isSuccess && !isVerifyingSession) {
      setIsVerifyingSession(true);
      creditsApi
        .verifySession(sessionId)
        .then((res) => {
          toast.success(`🎉 Payment verified! +${res.creditsAdded.toLocaleString()} credits added!`);
          loadData(true);
        })
        .catch((err) => {
          console.error('Failed to verify Stripe session:', err);
          toast.error(err?.response?.data?.message || err?.message || 'Failed to verify Stripe payment.');
        })
        .finally(() => {
          setIsVerifyingSession(false);
          searchParams.delete('session_id');
          searchParams.delete('success');
          setSearchParams(searchParams, { replace: true });
        });
    }
  }, [searchParams]);

  // Optimistically set initial balance
  useEffect(() => {
    if (selectedRestaurant && !balanceInfo) {
      const bal = selectedRestaurant.creditBalance ?? 100;
      setBalanceInfo({
        restaurantId: selectedRestaurant.id,
        restaurantName: selectedRestaurant.name,
        creditBalance: bal,
        isGraceMode: bal < 0,
        graceOrdersUsed: bal < 0 ? Math.abs(bal) : 0,
        graceOrdersRemaining: bal < 0 ? Math.max(0, 20 + bal) : 20,
        isExhausted: bal <= -20,
        isLowCredit: bal <= 50 && bal > 0,
      });
    }
  }, [selectedRestaurant, balanceInfo]);

  // Load packs and restaurant balance
  const loadData = useCallback(
    async (showSpinner = false, targetRestId?: string) => {
      if (showSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      const targetId = targetRestId || selectedRestaurant?.id || restaurants[0]?.id;

      try {
        // 1. Fetch active credit packs
        try {
          const activePacks = await packsApi.getActivePacks();
          if (Array.isArray(activePacks) && activePacks.length > 0) {
            setPacks(activePacks.filter((p) => p.code !== 'FREE'));
          }
        } catch (packErr) {
          console.warn('Using default packs fallback:', packErr);
          if (packs.length === 0) setPacks(DEFAULT_PACKS);
        }

        // 2. Fetch live balance & ledger
        if (targetId) {
          try {
            const bal = await creditsApi.getBalance(targetId);
            if (bal) setBalanceInfo(bal);
          } catch (balErr) {
            console.warn('Credits balance fetch warning:', balErr);
          }

          try {
            const ledgerRes = await creditsApi.getLedger(targetId, 50, 1);
            if (ledgerRes?.entries) setLedgerEntries(ledgerRes.entries);
          } catch (ledgerErr) {
            console.warn('Credits ledger fetch warning:', ledgerErr);
          }
        }
      } catch (err: any) {
        console.error('Failed to load billing data:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedRestaurant?.id, restaurants, packs.length],
  );

  useEffect(() => {
    if (restaurants.length > 0) {
      if (!activeRestaurantId) {
        setActiveRestaurantId(restaurants[0].id);
      }
      loadData(false, selectedRestaurant?.id || restaurants[0].id);
    } else {
      loadData(false);
    }
  }, [restaurants.length, activeRestaurantId, selectedRestaurant?.id]);

  const handleCheckoutSuccess = (res: PurchasePackResponse) => {
    toast.success(`+${res.creditsAdded.toLocaleString()} credits added to ${selectedRestaurant?.name || 'storefront'}!`);
    loadData(true, selectedRestaurant?.id);
  };

  const filteredEntries = ledgerEntries.filter((entry) => {
    if (ledgerFilter === 'ALL') return true;
    if (ledgerFilter === 'ORDER_CONFIRMED') return entry.reason === 'ORDER_CONFIRMED';
    if (ledgerFilter === 'PACK_PURCHASE') return entry.reason === 'PACK_PURCHASE';
    if (ledgerFilter === 'SIGNUP_BONUS') return entry.reason === 'SIGNUP_BONUS' || entry.reason === 'FREE_SIGNUP';
    return true;
  });

  const displayPacks = packs.length > 0 ? packs : DEFAULT_PACKS;

  const visiblePacks = useMemo(() => {
    if (planFilter === 'CORE') {
      return displayPacks.filter((p) => ['STARTER', 'GROWTH', 'PRO'].includes(p.code));
    }
    if (planFilter === 'SCALE') {
      return displayPacks.filter((p) => ['BUSINESS', 'CHAIN'].includes(p.code));
    }
    return displayPacks;
  }, [displayPacks, planFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Top Header & Store Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              <span>Plans & Order Credits</span>
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Zero monthly subscription fees. Pay only per confirmed order (1 order = 1 credit).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Restaurant Selector */}
            {restaurants.length > 1 && (
              <div className="relative">
                <select
                  value={selectedRestaurant?.id || ''}
                  onChange={(e) => setActiveRestaurantId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-text appearance-none pr-7 cursor-pointer hover:bg-surface-2 transition-colors"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <Building2 className="w-3 h-3 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Currency Switcher */}
            <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-border text-xs">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  currency === 'INR'
                    ? 'bg-surface text-text shadow-2xs font-semibold'
                    : 'text-muted hover:text-text'
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-surface text-text shadow-2xs font-semibold'
                    : 'text-muted hover:text-text'
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => loadData(true, selectedRestaurant?.id)}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Standard Web Underline Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex items-center gap-6 sm:gap-8 -mb-px" aria-label="Billing Tabs">
            <button
              type="button"
              onClick={() => handleSwitchTab('plans')}
              className={`group relative flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer border-b-2 ${
                activeMainTab === 'plans'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted hover:text-text hover:border-border'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${
                  activeMainTab === 'plans' ? 'text-primary' : 'text-muted group-hover:text-text'
                }`}
              />
              <span>Credit Plans</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeMainTab === 'plans'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-2 text-muted'
                }`}
              >
                5 Packs
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('history')}
              className={`group relative flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer border-b-2 ${
                activeMainTab === 'history'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted hover:text-text hover:border-border'
              }`}
            >
              <History
                className={`w-4 h-4 ${
                  activeMainTab === 'history' ? 'text-primary' : 'text-muted group-hover:text-text'
                }`}
              />
              <span>Remaining Credits & History</span>
              {balanceInfo && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeMainTab === 'history'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-2 text-muted group-hover:text-text'
                  }`}
                >
                  {balanceInfo.creditBalance.toLocaleString()} Credits
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CREDIT PLANS & PRICING                                             */}
        {/* ========================================================================= */}
        {activeMainTab === 'plans' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Quick Strip Summary & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h2 className="text-base font-bold text-text tracking-tight">
                  Choose a Prepaid Pack
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Credits never expire and roll over indefinitely. No contracts or monthly renewals.
                </p>
              </div>

              {/* Segmented Filter */}
              <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setPlanFilter('ALL')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    planFilter === 'ALL'
                      ? 'bg-surface text-text shadow-2xs font-semibold'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  All Packs (5)
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter('CORE')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    planFilter === 'CORE'
                      ? 'bg-surface text-text shadow-2xs font-semibold'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Single Outlets (3)
                </button>
                <button
                  type="button"
                  onClick={() => setPlanFilter('SCALE')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    planFilter === 'SCALE'
                      ? 'bg-surface text-text shadow-2xs font-semibold'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Chains & Multi-Store (2)
                </button>
              </div>
            </div>

            {/* Clean Professional Cards Grid */}
            <div
              className={`grid gap-4 ${
                visiblePacks.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'
                  : visiblePacks.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {visiblePacks.map((pack) => {
                const isPro = pack.code === 'PRO';
                const price = currency === 'USD' ? Number(pack.priceUsd) : Number(pack.priceInr);
                const symbol = currency === 'USD' ? '$' : '₹';
                const totalCredits = pack.ordersCount + (pack.bonusCredits || 0);
                const costPerOrder = (price / totalCredits).toFixed(2);
                const tagline = PACK_DESCRIPTIONS[pack.code] || 'Prepaid credit pack';

                return (
                  <div
                    key={pack.id}
                    className={`relative p-5 rounded-2xl bg-surface border flex flex-col justify-between transition-all duration-200 ${
                      isPro
                        ? 'border-primary ring-1 ring-primary/40 shadow-sm'
                        : 'border-border hover:border-text/30 shadow-2xs'
                    }`}
                  >
                    {/* Most Popular Badge */}
                    {isPro && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold tracking-wide shadow-xs whitespace-nowrap">
                        Most Popular
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-text tracking-tight">
                            {pack.name} Pack
                          </h3>
                          <span className="text-[10px] font-semibold text-muted font-mono uppercase bg-surface-2 px-1.5 py-0.5 rounded">
                            {pack.code}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1 leading-relaxed">
                          {tagline}
                        </p>
                      </div>

                      {/* Price & Effective Rate */}
                      <div className="pt-1 pb-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold tracking-tight text-text">
                            {symbol}{price}
                          </span>
                          <span className="text-xs text-muted font-medium">one-time</span>
                        </div>
                        <p className="text-[11px] text-muted font-medium mt-0.5">
                          Effective: ~{symbol}{costPerOrder} per confirmed order
                        </p>
                      </div>

                      {/* Order Allowance & Bonus */}
                      <div className="pt-3 pb-3 border-t border-b border-border/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted block text-[11px]">Included Capacity:</span>
                          <span className="font-bold text-text text-sm">
                            {totalCredits.toLocaleString()} Orders
                          </span>
                        </div>
                        {pack.bonusCredits > 0 ? (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            +{pack.bonusCredits.toLocaleString()} Bonus Free
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">Credits roll over</span>
                        )}
                      </div>

                      {/* Features List */}
                      <div className="space-y-2 text-xs pt-1">
                        <div className="flex items-center gap-2 text-text">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Touchless QR Menu & Ordering</span>
                        </div>
                        <div className="flex items-center gap-2 text-text">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>AI Menu Auto-Import & Photos</span>
                        </div>
                        <div className="flex items-center gap-2 text-text">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Kitchen Display (KDS with Timers)</span>
                        </div>
                        <div className="flex items-center gap-2 text-text">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Live Customer Tracking & Receipts</span>
                        </div>
                        {pack.featuresJson?.dailyReports && (
                          <div className="flex items-center gap-2 text-text font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Daily Sales & Revenue Analytics</span>
                          </div>
                        )}
                        {pack.featuresJson?.multiLanguage && (
                          <div className="flex items-center gap-2 text-text font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Multi-Language Menu Translation</span>
                          </div>
                        )}
                        {pack.featuresJson?.tvDisplay && (
                          <div className="flex items-center gap-2 text-text font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>TV Order Ready Expeditor Display</span>
                          </div>
                        )}
                        {pack.featuresJson?.multiCounter && (
                          <div className="flex items-center gap-2 text-text font-medium text-primary">
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Multi-Counter & Cashier Split</span>
                          </div>
                        )}
                        {pack.featuresJson?.multiOutlets && (
                          <div className="flex items-center gap-2 text-text font-medium text-primary">
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Multi-Outlet Franchise Matrix</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clean CTA Button */}
                    <div className="pt-4 mt-4 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setSelectedPackForCheckout(pack)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                          isPro
                            ? 'bg-primary hover:bg-primary-hover text-on-primary shadow-xs'
                            : 'bg-surface-2 hover:bg-surface-3 text-text border border-border'
                        }`}
                      >
                        <span>Choose {pack.name} ({symbol}{price})</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Link to Tab 2 */}
            <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between text-xs text-muted">
              <span>Need to check past order deductions or balance logs?</span>
              <button
                type="button"
                onClick={() => handleSwitchTab('history')}
                className="font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Balance & Usage History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REMAINING CREDITS & USAGE HISTORY                                  */}
        {/* ========================================================================= */}
        {activeMainTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Live Balance & Grace Buffer Overview Card */}
            {balanceInfo ? (
              <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                        {balanceInfo.restaurantName} • Live Available Balance
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        <span
                          className={`text-3xl font-bold tracking-tight ${
                            balanceInfo.creditBalance < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : balanceInfo.creditBalance <= 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-text'
                          }`}
                        >
                          {balanceInfo.creditBalance.toLocaleString()} Credits Remaining
                        </span>
                        <span className="text-xs text-muted">
                          (~{Math.max(0, balanceInfo.creditBalance)} orders ready to confirm)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('plans')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Top Up Credits</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Chips: Balance, Grace Used, Remaining */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border/80">
                    <span className="text-muted block text-[11px]">Deduction Rule</span>
                    <span className="font-semibold text-text mt-0.5 block">
                      1 Confirmed Order = 1 Credit
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border/80">
                    <span className="text-muted block text-[11px]">Emergency Buffer</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{balanceInfo.graceOrdersRemaining}/20 Grace Orders Left</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border/80">
                    <span className="text-muted block text-[11px]">Credit Expiration</span>
                    <span className="font-semibold text-text mt-0.5 block">
                      Never Expires • Infinite Rollover
                    </span>
                  </div>
                </div>

                {/* Warnings if low or exhausted */}
                {balanceInfo.isExhausted ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Credit balance exhausted. New orders cannot be accepted until topped up.</span>
                  </div>
                ) : balanceInfo.isGraceMode ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Grace buffer active: {balanceInfo.graceOrdersRemaining} emergency orders remaining before auto-cutoff.</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-surface border border-border animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-2" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-surface-2 rounded-md w-36" />
                  <div className="h-6 bg-surface-2 rounded-md w-48" />
                </div>
              </div>
            )}

            {/* Append-Only Transaction Ledger History */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-text tracking-tight flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-primary" />
                    <span>Transaction Ledger (Append-Only Audit Trail)</span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Immutable log of all order credits deducted (-1) and recharge top-ups (+).
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      ledgerFilter === 'ALL'
                        ? 'bg-surface text-text shadow-2xs font-semibold'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('ORDER_CONFIRMED')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      ledgerFilter === 'ORDER_CONFIRMED'
                        ? 'bg-surface text-text shadow-2xs font-semibold'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    Orders (-1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('PACK_PURCHASE')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      ledgerFilter === 'PACK_PURCHASE'
                        ? 'bg-surface text-text shadow-2xs font-semibold'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    Top-ups (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('SIGNUP_BONUS')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      ledgerFilter === 'SIGNUP_BONUS'
                        ? 'bg-surface text-text shadow-2xs font-semibold'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    Bonuses
                  </button>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xs">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center text-muted text-xs">
                    <Receipt className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <span>No transaction events found for this filter.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-surface-2/50 text-muted uppercase font-semibold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3.5">Date & Time</th>
                          <th className="py-2.5 px-3.5">Reason / Activity</th>
                          <th className="py-2.5 px-3.5 text-center">Change</th>
                          <th className="py-2.5 px-3.5 text-right">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredEntries.map((entry) => {
                          const isPositive = entry.delta > 0;
                          return (
                            <tr key={entry.id} className="hover:bg-surface-2/30 transition-colors">
                              <td className="py-2.5 px-3.5 text-muted whitespace-nowrap">
                                {new Date(entry.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                <span className="opacity-75">
                                  {new Date(entry.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className="font-medium text-text">
                                  {entry.reason === 'FREE_SIGNUP' && '🎁 Signup Welcome Gift (100 Free Credits)'}
                                  {entry.reason === 'SIGNUP_BONUS' && '🎁 Storefront Welcome Bonus'}
                                  {entry.reason === 'ORDER_CONFIRMED' && '🛒 Order Confirmed & Deducted'}
                                  {entry.reason === 'PACK_PURCHASE' && '⚡ Credit Pack Recharge'}
                                  {entry.reason === 'GRACE_RECOVERY' && '🛡️ Grace Buffer Recovery'}
                                  {entry.reason === 'ADMIN_ADJUSTMENT' && '🔧 System Adjustment'}
                                  {![
                                    'FREE_SIGNUP',
                                    'SIGNUP_BONUS',
                                    'ORDER_CONFIRMED',
                                    'PACK_PURCHASE',
                                    'GRACE_RECOVERY',
                                    'ADMIN_ADJUSTMENT',
                                  ].includes(entry.reason) && entry.reason}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                    isPositive
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isPositive ? `+${entry.delta}` : entry.delta}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-text">
                                {entry.balanceAfter.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credit Pack Checkout Modal */}
      {selectedPackForCheckout && (
        <CreditCheckoutModal
          isOpen={!!selectedPackForCheckout}
          onClose={() => setSelectedPackForCheckout(null)}
          pack={selectedPackForCheckout}
          restaurantId={selectedRestaurant?.id || ''}
          restaurantName={selectedRestaurant?.name || 'Restaurant'}
          currency={currency}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </DashboardLayout>
  );
};
