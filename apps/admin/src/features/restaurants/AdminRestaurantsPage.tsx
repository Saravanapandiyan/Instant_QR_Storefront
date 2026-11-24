import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  ExternalLink,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  Ban,
  Check,
  MapPin,
  Building2,
  Coins,
  Sparkles,
  ArrowUpRight,
  Plus,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { AdminPagination } from '../../components/common/AdminPagination.tsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import { adminRestaurantsApi, type AdminRestaurantTenant } from '../../api/adminRestaurantsApi.ts';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

type StatusTab = 'ALL' | 'ACTIVE' | 'SUSPENDED';
type PlanTab = 'ALL' | 'FREE' | 'PAID';

export function AdminRestaurantsPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurantId } = useAdminScopeStore();

  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [planTab, setPlanTab] = useState<PlanTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<AdminRestaurantTenant | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Credit Adjustment Modal State
  const [adjustingTenant, setAdjustingTenant] = useState<AdminRestaurantTenant | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState<string>('ADMIN_BONUS');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Lock background scroll when drawer or adjustment modal is open
  useBodyScrollLock(Boolean(selectedTenant || adjustingTenant));

  // Live Query
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-restaurants', statusTab, planTab, searchQuery],
    queryFn: () =>
      adminRestaurantsApi.getRestaurants({
        search: searchQuery.trim() || undefined,
        status: statusTab,
        planTier: planTab,
      }),
  });

  const counts = data?.counts ?? { all: 0, active: 0, suspended: 0, free: 0, paid: 0, pendingReview: 0 };
  const restaurants = data?.restaurants ?? [];

  const activeSelectedTenant = selectedTenant
    ? restaurants.find((r) => r.id === selectedTenant.id) || selectedTenant
    : null;

  // Mutation to Suspend / Reactivate a tenant
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminRestaurantsApi.updateStatus(id, isActive),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      if (selectedTenant) {
        setSelectedTenant((prev) => (prev ? { ...prev, isActive: res.isActive } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update tenant status.');
    },
  });

  // Mutation to Adjust Credits
  const adjustMutation = useMutation({
    mutationFn: ({
      id,
      delta,
      reason,
      notes,
    }: {
      id: string;
      delta: number;
      reason: string;
      notes?: string;
    }) => adminRestaurantsApi.adjustCredits(id, { delta, reason, notes }),
    onSuccess: (res) => {
      toast.success(`Credits adjusted! New balance: ${res.newBalance} orders`);
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setAdjustingTenant(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to adjust credits.');
    },
  });

  // 1-Click Impersonation Mutation
  const impersonateMutation = useMutation({
    mutationFn: (restaurantId: string) => adminRestaurantsApi.impersonate(restaurantId),
    onSuccess: (res) => {
      toast.success(`Launching console for "${res.restaurant.name}"...`);
      const targetUrl = `http://localhost:5173/auth/impersonate?token=${encodeURIComponent(
        res.accessToken,
      )}&restaurantId=${encodeURIComponent(res.restaurant.id)}`;
      window.open(targetUrl, '_blank');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to launch tenant console.');
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingTenant) return;
    if (adjustDelta === 0) {
      toast.error('Adjustment delta cannot be 0.');
      return;
    }
    adjustMutation.mutate({
      id: adjustingTenant.id,
      delta: adjustDelta,
      reason: adjustReason,
      notes: adjustNotes || undefined,
    });
  };

  const totalBranches = restaurants.reduce((acc, r) => acc + (r.branches?.length || 0), 0);

  const scopedRestaurants = restaurants.filter(
    (r) => selectedRestaurantId === 'ALL' || r.id === selectedRestaurantId
  );

  const totalPages = Math.ceil(scopedRestaurants.length / pageSize) || 1;
  const paginatedRestaurants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return scopedRestaurants.slice(start, start + pageSize);
  }, [scopedRestaurants, page, pageSize]);

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Restaurants & Fleet"
          description="Supervise brand tenancies, classify Free vs. Paid subscribers, adjust credit balances, and launch 1-click tenant consoles."
        >
          <div
            className="px-3 py-1.5 rounded-lg border flex items-center gap-2 font-medium text-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <Store className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              <strong className="font-bold text-emerald-500">{counts.active}</strong> / {counts.all} Active
            </span>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
            title="Refresh Tenants"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </AdminPageHeader>

        {/* Filter Strip: Status + Free/Paid Tier + Search */}
        <div
          className="p-3 rounded-xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex p-1 rounded-lg border gap-1 text-xs"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
              }}
            >
              <button
                onClick={() => setStatusTab('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  statusTab === 'ALL' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: statusTab === 'ALL' ? 'var(--adm-surface)' : 'transparent',
                  color: statusTab === 'ALL' ? 'var(--adm-text)' : 'var(--adm-muted)',
                  border: statusTab === 'ALL' ? '1px solid var(--adm-border)' : '1px solid transparent',
                }}
              >
                All Status <span className="opacity-60 font-mono">({counts.all})</span>
              </button>

              <button
                onClick={() => setStatusTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusTab === 'ACTIVE' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: statusTab === 'ACTIVE' ? 'var(--adm-surface)' : 'transparent',
                  color: statusTab === 'ACTIVE' ? '#10b981' : 'var(--adm-muted)',
                  border: statusTab === 'ACTIVE' ? '1px solid var(--adm-border)' : '1px solid transparent',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active <span className="opacity-60 font-mono">({counts.active})</span>
              </button>

              <button
                onClick={() => setStatusTab('SUSPENDED')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusTab === 'SUSPENDED' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: statusTab === 'SUSPENDED' ? 'var(--adm-surface)' : 'transparent',
                  color: statusTab === 'SUSPENDED' ? '#ef4444' : 'var(--adm-muted)',
                  border: statusTab === 'SUSPENDED' ? '1px solid var(--adm-border)' : '1px solid transparent',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Suspended <span className="opacity-60 font-mono">({counts.suspended})</span>
              </button>
            </div>

            {/* Plan Tier Selector (Free vs Paid) */}
            <div
              className="inline-flex p-1 rounded-lg border gap-1 text-xs"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
              }}
            >
              <button
                onClick={() => setPlanTab('ALL')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  planTab === 'ALL' ? 'shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: planTab === 'ALL' ? 'var(--adm-surface)' : 'transparent',
                  color: planTab === 'ALL' ? 'var(--adm-text)' : 'var(--adm-muted)',
                  border: planTab === 'ALL' ? '1px solid var(--adm-border)' : '1px solid transparent',
                }}
              >
                All Plans
              </button>
              <button
                onClick={() => setPlanTab('FREE')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  planTab === 'FREE' ? 'shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: planTab === 'FREE' ? 'var(--adm-surface)' : 'transparent',
                  color: planTab === 'FREE' ? '#3b82f6' : 'var(--adm-muted)',
                  border: planTab === 'FREE' ? '1px solid var(--adm-border)' : '1px solid transparent',
                }}
              >
                <span>Free Plan</span>
                <span className="font-mono text-[10px] opacity-75">({counts.free})</span>
              </button>
              <button
                onClick={() => setPlanTab('PAID')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  planTab === 'PAID' ? 'shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: planTab === 'PAID' ? 'var(--adm-surface)' : 'transparent',
                  color: planTab === 'PAID' ? '#10b981' : 'var(--adm-muted)',
                  border: planTab === 'PAID' ? '1px solid var(--adm-border)' : '1px solid transparent',
                }}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Paid Plan</span>
                <span className="font-mono text-[10px] opacity-75">({counts.paid})</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--adm-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by brand name, slug (/r/...), or owner email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-75 cursor-pointer"
                style={{ color: 'var(--adm-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <div
          className="rounded-xl border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Manifest Sub-Header */}
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-muted)',
            }}
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="font-bold" style={{ color: 'var(--adm-text)' }}>
                Tenants Directory
              </span>
              <span>•</span>
              <span>{scopedRestaurants.length} Concepts</span>
              <span>•</span>
              <span>{totalBranches} Outlets Provisioned</span>
            </div>
            <span className="text-[11px]">Click row to inspect or adjust credits</span>
          </div>

          {/* Table Data */}
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Loading restaurant directory...
              </p>
            </div>
          ) : scopedRestaurants.length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: 'var(--adm-muted)' }} />
              <h3 className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                No Restaurants Found
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--adm-muted)' }}>
                No records match the active search filter, status, or plan tier.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className="border-b uppercase text-[11px] font-semibold tracking-wider select-none"
                    style={{
                      borderColor: 'var(--adm-border)',
                      backgroundColor: 'var(--adm-surface-subtle)',
                      color: 'var(--adm-muted)',
                    }}
                  >
                    <th className="py-3 px-4">Brand / Concept</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Order Credits</th>
                    <th className="py-3 px-4">Storefront Route</th>
                    <th className="py-3 px-4">Owner Contact</th>
                    <th className="py-3 px-4">Outlets</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {paginatedRestaurants.map((tenant) => {
                    const isSelectedInScope = selectedRestaurantId === tenant.id;
                    const isPaid = tenant.planTier === 'PAID';
                    const isLowCredit = tenant.creditBalance <= 20;

                    return (
                      <tr
                        key={tenant.id}
                        onClick={() => setSelectedTenant(tenant)}
                        className="hover:opacity-95 transition-colors cursor-pointer group"
                        style={{
                          backgroundColor:
                            isSelectedInScope
                              ? 'rgba(99, 102, 241, 0.08)'
                              : selectedTenant?.id === tenant.id
                              ? 'var(--adm-surface-subtle)'
                              : 'transparent',
                        }}
                      >
                        {/* Brand Concept */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border"
                              style={{
                                backgroundColor: isSelectedInScope ? '#6366f1' : 'var(--adm-primary-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: isSelectedInScope ? '#ffffff' : 'var(--adm-primary)',
                              }}
                            >
                              {tenant.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold tracking-tight truncate flex items-center gap-1.5 text-xs">
                                <span style={{ color: 'var(--adm-text)' }}>{tenant.name}</span>
                                {tenant.isActive && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] font-mono block" style={{ color: 'var(--adm-muted)' }}>
                                ID: {tenant.id.slice(0, 8)} • {tenant.defaultCurrency}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plan Tier */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              PAID PLAN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold bg-blue-500/10 text-blue-600 border-blue-500/20">
                              FREE TIER
                            </span>
                          )}
                        </td>

                        {/* Order Credits */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Coins className={`w-3.5 h-3.5 ${isLowCredit ? 'text-amber-500' : 'text-emerald-500'}`} />
                            <span
                              className={`font-mono font-bold ${
                                isLowCredit ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              {tenant.creditBalance.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-neutral-400">credits</span>
                          </div>
                        </td>

                        {/* Storefront Route */}
                        <td className="py-3 px-4 text-xs">
                          <a
                            href={`http://localhost:5174/r/${tenant.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono hover:underline"
                            style={{
                              backgroundColor: 'var(--adm-surface-subtle)',
                              borderColor: 'var(--adm-border)',
                              color: 'var(--adm-primary)',
                            }}
                          >
                            <span>/r/{tenant.slug}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        </td>

                        {/* Owner Contact */}
                        <td className="py-3 px-4 text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs truncate" style={{ color: 'var(--adm-text)' }}>
                              {tenant.owner?.name || 'Unknown'}
                            </span>
                            <span className="text-[11px] truncate" style={{ color: 'var(--adm-muted)' }}>
                              {tenant.owner?.email}
                            </span>
                          </div>
                        </td>

                        {/* Fleet Outlets */}
                        <td className="py-3 px-4 text-xs">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                            style={{
                              backgroundColor: 'var(--adm-surface-subtle)',
                              borderColor: 'var(--adm-border)',
                              color: 'var(--adm-text)',
                            }}
                          >
                            {tenant.branches?.length || 0} Outlets
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {tenant.isActive ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold"
                              style={{
                                backgroundColor: 'var(--adm-success-subtle)',
                                borderColor: 'var(--adm-success)',
                                color: 'var(--adm-success)',
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              ACTIVE
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold"
                              style={{
                                backgroundColor: 'var(--adm-error-subtle)',
                                borderColor: 'var(--adm-error)',
                                color: 'var(--adm-error)',
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              SUSPENDED
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Adjust Credits Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingTenant(tenant);
                                setAdjustDelta(100);
                                setAdjustReason('ADMIN_BONUS');
                                setAdjustNotes('');
                              }}
                              className="px-2 py-1 rounded-md border text-[11px] font-medium text-amber-600 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Adjust Credits (+/-)"
                            >
                              <Coins className="w-3 h-3" />
                              Credits
                            </button>

                            {/* Launch Console (Impersonate) */}
                            <button
                              type="button"
                              onClick={() => impersonateMutation.mutate(tenant.id)}
                              disabled={impersonateMutation.isPending}
                              className="px-2 py-1 rounded-md border text-[11px] font-medium text-indigo-600 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Launch Owner Console"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              Console
                            </button>

                            {/* Inspect Drawer */}
                            <button
                              type="button"
                              onClick={() => setSelectedTenant(tenant)}
                              className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                              style={{
                                backgroundColor: 'var(--adm-surface-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: 'var(--adm-text)',
                              }}
                              title="Inspect Tenant"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={scopedRestaurants.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="restaurants"
          />
        </div>
      </div>

      {/* Slide-Over Inspection Drawer */}
      {activeSelectedTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTenant(null)}
          />

          <div
            className="relative w-full max-w-lg h-full overflow-y-auto border-l shadow-2xl flex flex-col z-10"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            {/* Header */}
            <div
              className="p-4 border-b flex items-start justify-between sticky top-0 z-10 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border"
                  style={{
                    backgroundColor: 'var(--adm-primary-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-primary)',
                  }}
                >
                  {activeSelectedTenant.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                      {activeSelectedTenant.name}
                    </h2>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded border"
                      style={{
                        backgroundColor: 'var(--adm-surface-subtle)',
                        borderColor: 'var(--adm-border)',
                        color: 'var(--adm-muted)',
                      }}
                    >
                      {activeSelectedTenant.defaultCurrency}
                    </span>
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                    ID: {activeSelectedTenant.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                  color: 'var(--adm-muted)',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 flex-1">
              {/* Operational Status Control Strip */}
              <div
                className="p-3.5 rounded-lg border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                    Tenancy Status
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>
                    {activeSelectedTenant.isActive
                      ? 'Storefront is active and customer orders are allowed.'
                      : 'Storefront is suspended. QR codes return 503 Maintenance.'}
                  </span>
                </div>

                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: activeSelectedTenant.id,
                      isActive: !activeSelectedTenant.isActive,
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border hover:opacity-85"
                  style={{
                    backgroundColor: activeSelectedTenant.isActive
                      ? 'var(--adm-error-subtle)'
                      : 'var(--adm-success-subtle)',
                    borderColor: activeSelectedTenant.isActive
                      ? 'var(--adm-error)'
                      : 'var(--adm-success)',
                    color: activeSelectedTenant.isActive
                      ? 'var(--adm-error)'
                      : 'var(--adm-success)',
                  }}
                >
                  {statusMutation.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : activeSelectedTenant.isActive ? (
                    <>
                      <Ban className="w-3 h-3" />
                      <span>Suspend</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Reactivate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Credits & Plan Tier Card */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                      Order Credits Balance
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      activeSelectedTenant.planTier === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}
                  >
                    {activeSelectedTenant.planTier === 'PAID' ? 'PAID PLAN' : 'FREE TIER'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100">
                    {activeSelectedTenant.creditBalance.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-neutral-500">Credits</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustingTenant(activeSelectedTenant);
                      setAdjustDelta(100);
                      setAdjustReason('ADMIN_BONUS');
                      setAdjustNotes('');
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adjust
                  </button>
                </div>

                {activeSelectedTenant.creditBalance <= 20 && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Restaurant is running low on order credits (&le; 20). Top-up recommended.</span>
                  </div>
                )}
              </div>

              {/* Impersonation Quick Action */}
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                    Tenant Owner Console
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Direct access as owner ({activeSelectedTenant.owner?.name})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => impersonateMutation.mutate(activeSelectedTenant.id)}
                  disabled={impersonateMutation.isPending}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Launch Console
                </button>
              </div>

              {/* Identity Manifest */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-tight block" style={{ color: 'var(--adm-text)' }}>
                  Tenancy Details
                </span>
                <div
                  className="p-3 rounded-lg border space-y-2 text-xs"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--adm-muted)' }}>Storefront Route:</span>
                    <a
                      href={`http://localhost:5174/r/${activeSelectedTenant.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <span>/r/{activeSelectedTenant.slug}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--adm-muted)' }}>Owner:</span>
                    <span style={{ color: 'var(--adm-text)' }}>
                      {activeSelectedTenant.owner?.name} ({activeSelectedTenant.owner?.email})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--adm-muted)' }}>Registered:</span>
                    <span style={{ color: 'var(--adm-text)' }}>
                      {new Date(activeSelectedTenant.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outlet Fleet */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-tight block" style={{ color: 'var(--adm-text)' }}>
                  Outlets &amp; Branches ({activeSelectedTenant.branches?.length || 0})
                </span>

                <div className="space-y-1.5">
                  {activeSelectedTenant.branches && activeSelectedTenant.branches.length > 0 ? (
                    activeSelectedTenant.branches.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-lg border flex items-start justify-between text-xs"
                        style={{
                          backgroundColor: 'var(--adm-surface-subtle)',
                          borderColor: 'var(--adm-border)',
                        }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-bold" style={{ color: 'var(--adm-text)' }}>
                              {b.name}
                            </span>
                          </div>
                          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--adm-muted)' }}>
                            <MapPin className="w-3 h-3" />
                            <span>{b.address || 'Address not configured'}</span>
                          </p>
                        </div>

                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded border font-semibold"
                          style={{
                            backgroundColor: 'var(--adm-surface)',
                            borderColor: 'var(--adm-border)',
                            color: b.isActive ? '#10b981' : '#ef4444',
                          }}
                        >
                          {b.isActive ? 'Active' : 'Offline'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic" style={{ color: 'var(--adm-muted)' }}>
                      No branches provisioned yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {adjustingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Adjust Credits: {adjustingTenant.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Current Balance: <strong className="font-mono">{adjustingTenant.creditBalance}</strong> credits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingTenant(null)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Credit Delta (+ to grant, - to deduct) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((prev) => -Math.abs(prev || 100))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      adjustDelta < 0 ? 'bg-rose-500 text-white border-rose-500' : 'border-neutral-300'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5 inline mr-1" /> Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((prev) => Math.abs(prev || 100))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      adjustDelta > 0 ? 'bg-emerald-500 text-white border-emerald-500' : 'border-neutral-300'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> Grant
                  </button>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    required
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                  New expected balance: {adjustingTenant.creditBalance + (adjustDelta || 0)} credits
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Adjustment Reason *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                  <option value="ADMIN_BONUS">ADMIN_BONUS (Promotional Grant)</option>
                  <option value="PROMOTIONAL_CREDIT">PROMOTIONAL_CREDIT (Marketing Campaign)</option>
                  <option value="SUPPORT_REMEDY">SUPPORT_REMEDY (Service SLA Compensation)</option>
                  <option value="BILLING_CORRECTION">BILLING_CORRECTION (Manual Top-up / Refund)</option>
                  <option value="MANUAL_AUDIT">MANUAL_AUDIT (Audit Correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Internal Notes / Reference Ticket (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Granted 500 bonus credits for Q4 onboarding"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                  type="button"
                  onClick={() => setAdjustingTenant(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending || adjustDelta === 0}
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs cursor-pointer"
                  style={{ backgroundColor: 'var(--adm-primary)' }}
                >
                  {adjustMutation.isPending ? 'Applying...' : 'Apply Credit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
