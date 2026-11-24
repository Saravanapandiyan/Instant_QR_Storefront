import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Store,
  Building2,
  Receipt,
  CreditCard,
  ChevronRight,
  Users,
  UtensilsCrossed,
  RefreshCw,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { adminDashboardApi } from '../../api/adminDashboardApi.ts';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { useCurrencyConverter } from '../../utils/currencyConverter.ts';

export function AdminDashboardPage() {
  const {
    selectedRestaurantId,
    selectedBranchId,
    setSelectedRestaurantId,
  } = useAdminScopeStore();

  const { formatAmount } = useCurrencyConverter();
  const [dateDays, setDateDays] = useState<number>(30);

  // Live queries to NestJS Backend with scope and date filters
  const { data: stats, refetch: refetchStats, isRefetching } = useQuery({
    queryKey: ['admin-dashboard-stats', selectedRestaurantId, selectedBranchId, dateDays],
    queryFn: () =>
      adminDashboardApi.getStats({
        restaurantId: selectedRestaurantId,
        branchId: selectedBranchId,
        days: dateDays,
      }),
  });

  const { data: velocityPoints = [], isLoading: velocityLoading } = useQuery({
    queryKey: ['admin-dashboard-velocity', selectedRestaurantId, selectedBranchId, dateDays],
    queryFn: () =>
      adminDashboardApi.getVelocity({
        restaurantId: selectedRestaurantId,
        branchId: selectedBranchId,
        days: dateDays,
      }),
  });

  const { data: fleet = [], isLoading: fleetLoading } = useQuery({
    queryKey: ['admin-dashboard-fleet', selectedRestaurantId],
    queryFn: () => adminDashboardApi.getRecentFleet({ restaurantId: selectedRestaurantId }),
  });

  const maxVelocity = Math.max(...velocityPoints.map((p) => p.orders), 10);
  const totalVolumeInPeriod = velocityPoints.reduce((acc, p) => acc + p.orders, 0);
  const totalGmvInPeriod = velocityPoints.reduce((acc, p) => acc + p.gmv, 0);

  // Currency conversions
  const gmvMetric = formatAmount(stats?.orders.grossVolume || totalGmvInPeriod);
  const gmvVelocityTotal = formatAmount(totalGmvInPeriod);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Clean, Modern Admin Page Header */}
        <AdminPageHeader
          title="Executive Overview"
          description="Cross-restaurant order telemetry, brand adoption rates, and financial metrics."
        >
          {/* Date Range Selector */}
          <div
            className="inline-flex p-1 rounded-lg border text-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            {[
              { label: '7D', value: 7 },
              { label: '30D', value: 30 },
              { label: '90D', value: 90 },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDateDays(opt.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  dateDays === opt.value
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => refetchStats()}
            disabled={isRefetching}
            className="p-2 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </AdminPageHeader>

        {/* 6 Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Brands Fleet */}
          <div
            className="rounded-2xl border p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1">
              <span>Brands Fleet</span>
              <Store className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                {stats?.restaurants.total ?? 0}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {stats?.restaurants.active ?? 0} active tenants
              </div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-neutral-400" style={{ borderColor: 'var(--adm-border)' }}>
              <span>Verified: {stats?.restaurants.active ?? 0}</span>
              <Link to="/restaurants" className="hover:underline text-indigo-500">Fleet &rarr;</Link>
            </div>
          </div>

          {/* Card 2: Physical Outlets */}
          <div
            className="rounded-2xl border p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1">
              <span>Outlets</span>
              <Building2 className="w-4 h-4 text-sky-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                {stats?.branches.total ?? 0}
              </div>
              <div className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                {stats?.branches.active ?? 0} open for orders
              </div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-neutral-400" style={{ borderColor: 'var(--adm-border)' }}>
              <span>{stats?.branches.availabilityRate ?? 100}% live</span>
              <Link to="/branches" className="hover:underline text-indigo-500">Outlets &rarr;</Link>
            </div>
          </div>

          {/* Card 3: Dishes Catalog */}
          <div
            className="rounded-2xl border p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1">
              <span>Dishes Catalog</span>
              <UtensilsCrossed className="w-4 h-4 text-amber-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                {stats?.catalog.totalProducts ?? 0}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                {stats?.catalog.totalCategories ?? 0} categories
              </div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-neutral-400" style={{ borderColor: 'var(--adm-border)' }}>
              <span>Multi-language</span>
              <Link to="/dishes" className="hover:underline text-indigo-500">Catalog &rarr;</Link>
            </div>
          </div>

          {/* Card 4: Users & Staff */}
          <div
            className="rounded-2xl border p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1">
              <span>Users &amp; Staff</span>
              <Users className="w-4 h-4 text-purple-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                {stats?.users.total ?? 0}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                {stats?.users.owners ?? 0} Brand Owners
              </div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-neutral-400" style={{ borderColor: 'var(--adm-border)' }}>
              <span>{stats?.users.superAdmins ?? 0} Super Admins</span>
              <Link to="/users" className="hover:underline text-indigo-500">IAM &rarr;</Link>
            </div>
          </div>

          {/* Card 5: Scoped Orders */}
          <div
            className="rounded-2xl border p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1">
              <span>Orders ({dateDays}D)</span>
              <Receipt className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                {stats?.orders.total ?? totalVolumeInPeriod}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Touchless QR dining
              </div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-neutral-400" style={{ borderColor: 'var(--adm-border)' }}>
              <span>KDS &amp; Counter</span>
              <span className="text-emerald-500 font-semibold">100% Real-time</span>
            </div>
          </div>

          {/* Card 6: Sales Volume with Multi-Currency Conversion */}
          <div
            className="rounded-2xl border p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-1">
              <span>Sales Volume ({dateDays}D)</span>
              <CreditCard className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                {gmvMetric.formatted}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                Stripe &amp; Cash Settlements
              </div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-[11px] text-neutral-400" style={{ borderColor: 'var(--adm-border)' }}>
              <span>Stripe Gateway</span>
              <Link to="/settings/pay" className="hover:underline text-indigo-500">Config &rarr;</Link>
            </div>
          </div>
        </div>

        {/* Analytics Section: Velocity Chart & Fleet Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Velocity & Orders Timeline */}
          <div
            className="lg:col-span-2 rounded-2xl border p-5 flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Transaction &amp; Order Volume Velocity
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Timeline of orders across {selectedRestaurantId !== 'ALL' ? 'the selected brand' : 'all active brands'} over the last {dateDays} days.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--adm-primary)' }} />
                  <span className="text-neutral-500">Orders ({totalVolumeInPeriod})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-neutral-500">
                    GMV ({gmvVelocityTotal.formatted})
                  </span>
                </div>
              </div>
            </div>

            {/* Velocity Chart */}
            <div className="h-52 w-full flex items-center justify-center p-2">
              {velocityLoading ? (
                <div className="text-xs text-neutral-500 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Loading velocity telemetry...</span>
                </div>
              ) : velocityPoints.length === 0 || velocityPoints.every((p) => p.orders === 0 && p.gmv === 0) ? (
                <div className="flex flex-col items-center justify-center text-center max-w-sm py-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 border"
                    style={{
                      backgroundColor: 'var(--adm-surface-subtle)',
                      borderColor: 'var(--adm-border)',
                      color: 'var(--adm-muted)',
                    }}
                  >
                    <Receipt className="w-5 h-5 opacity-40" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Awaiting Customer Orders in this Window
                  </h4>
                  <p className="text-xs mt-1 text-neutral-500 leading-relaxed">
                    Live transaction ingestion is running. As storefront guests place orders via QR code, real-time volume graphs here automatically.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-end gap-1 pt-6 pb-2">
                  {velocityPoints.map((point, idx) => {
                    const heightPercent = maxVelocity > 0 ? Math.max(6, Math.round((point.orders / maxVelocity) * 100)) : 6;
                    const pointGmv = formatAmount(point.gmv);
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                      >
                        <div
                          className="w-full rounded-t-sm transition-all group-hover:brightness-110"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: point.orders > 0 ? 'var(--adm-primary)' : 'rgba(156, 163, 175, 0.2)',
                          }}
                        />

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-neutral-900 text-white text-[10px] rounded px-2 py-1 shadow-lg whitespace-nowrap">
                            <span className="font-bold">{point.date}</span>: {point.orders} orders ({pointGmv.formatted})
                          </div>
                          <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs text-neutral-500" style={{ borderColor: 'var(--adm-border)' }}>
              <span>Period: {dateDays} days retrospective</span>
              <span>100% In-Memory Streaming</span>
            </div>
          </div>

          {/* Scoped Brands & Fleets List */}
          <div
            className="rounded-2xl border p-5 flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Restaurant Concepts
                </h2>
                <Link
                  to="/restaurants"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="space-y-2.5">
                {fleetLoading ? (
                  <div className="text-xs text-neutral-400 py-4 text-center">Loading fleet...</div>
                ) : fleet.length === 0 ? (
                  <div className="text-xs text-neutral-400 py-4 text-center">No restaurants registered.</div>
                ) : (
                  fleet.slice(0, 5).map((tenant) => (
                    <div
                      key={tenant.id}
                      onClick={() => setSelectedRestaurantId(tenant.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedRestaurantId === tenant.id
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-xs'
                          : 'border-transparent hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                          style={{
                            backgroundColor: 'var(--adm-surface-subtle)',
                            color: 'var(--adm-text)',
                            border: '1px solid var(--adm-border)',
                          }}
                        >
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {tenant.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {tenant.branchesCount} Outlets &bull; {tenant.productsCount} Dishes
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t mt-4 text-[11px] text-neutral-500 flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
              <span>Click concept to scope dashboard</span>
              <span className="font-semibold">{fleet.length} active</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
