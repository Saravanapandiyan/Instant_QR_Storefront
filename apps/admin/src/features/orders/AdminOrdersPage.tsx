import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Search,
  RefreshCw,
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  ShoppingBag,
  ChefHat,
  BellRing,
  Calendar,
  History,
  Radio,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { AdminPagination } from '../../components/common/AdminPagination.tsx';
import { AdminDatePicker } from '../../components/ui/DatePicker.tsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import {
  adminOrdersApi,
  type AdminOrder,
  type OrderStatus,
} from '../../api/adminOrdersApi.ts';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { useCurrencyConverter } from '../../utils/currencyConverter.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

const STATUS_BADGES: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  PENDING: {
    label: 'Pending',
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#d97706',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'rgba(59, 130, 246, 0.1)',
    text: '#2563eb',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: CheckCircle2,
  },
  PREPARING: {
    label: 'Preparing',
    bg: 'rgba(168, 85, 247, 0.1)',
    text: '#9333ea',
    border: 'rgba(168, 85, 247, 0.3)',
    icon: ChefHat,
  },
  READY: {
    label: 'Ready',
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#059669',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: BellRing,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'rgba(107, 114, 128, 0.1)',
    text: '#4b5563',
    border: 'rgba(107, 114, 128, 0.25)',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#dc2626',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: XCircle,
  },
};

type ViewTab = 'LIVE_STREAM' | 'ORDER_HISTORY';
type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurantId, selectedBranchId } = useAdminScopeStore();
  const { formatAmount } = useCurrencyConverter();

  // Top Real Tabs: Live Orders Stream vs. Order History
  const [activeTab, setActiveTab] = useState<ViewTab>('LIVE_STREAM');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [liveStatusFilter, setLiveStatusFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Lock background scroll when order details modal is open
  useBodyScrollLock(Boolean(selectedOrder));

  // Date filters for Order History
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Active status depending on current tab
  const effectiveStatus = activeTab === 'LIVE_STREAM' ? liveStatusFilter : historyStatusFilter;

  // Compute resolved ISO date strings for query
  const dateRange = useMemo(() => {
    if (activeTab === 'LIVE_STREAM') {
      return { startDate: undefined, endDate: undefined };
    }

    const now = new Date();

    if (datePreset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }

    if (datePreset === 'YESTERDAY') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }

    if (datePreset === 'LAST_7_DAYS') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }

    if (datePreset === 'LAST_30_DAYS') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }

    if (datePreset === 'CUSTOM') {
      return {
        startDate: customStartDate ? new Date(customStartDate).toISOString() : undefined,
        endDate: customEndDate ? new Date(customEndDate + 'T23:59:59.999Z').toISOString() : undefined,
      };
    }

    return { startDate: undefined, endDate: undefined };
  }, [activeTab, datePreset, customStartDate, customEndDate]);

  // Query orders
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: [
      'admin-orders',
      selectedRestaurantId,
      selectedBranchId,
      effectiveStatus,
      searchQuery,
      dateRange.startDate,
      dateRange.endDate,
      page,
      pageSize,
      activeTab,
    ],
    queryFn: () =>
      adminOrdersApi.getOrders({
        restaurantId: selectedRestaurantId,
        branchId: selectedBranchId,
        status: effectiveStatus,
        search: searchQuery.trim() || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page,
        limit: pageSize,
      }),
    refetchInterval: activeTab === 'LIVE_STREAM' ? 10000 : false, // 10s auto-refresh on live stream only
  });

  const rawOrders = data?.orders ?? [];
  const counts = data?.counts ?? {
    all: 0,
    pending: 0,
    active: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    totalGmv: 0,
  };

  // If in Live Stream mode and filter is 'ALL', show active orders (Pending, Confirmed, Preparing, Ready)
  // or all orders if there are only past orders so user never sees an artificially empty list.
  const displayOrders = useMemo(() => {
    if (activeTab === 'LIVE_STREAM' && liveStatusFilter === 'ALL') {
      const activeOnly = rawOrders.filter((o) =>
        ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
      );
      return activeOnly.length > 0 ? activeOnly : rawOrders;
    }
    return rawOrders;
  }, [rawOrders, activeTab, liveStatusFilter]);

  const paginationInfo = data?.pagination || {
    totalItems: displayOrders.length,
    page: 1,
    limit: pageSize,
    totalPages: 1,
  };

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminOrdersApi.updateOrderStatus(orderId, status),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      if (selectedOrder) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: res.order.status } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update order status');
    },
  });

  const formatElapsed = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Orders & Kitchen Telemetry"
          description="Cross-restaurant live orders stream, real-time ticket progression, and searchable audit ledger."
        >
          {activeTab === 'LIVE_STREAM' && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Telemetry (10s)</span>
            </div>
          )}

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
            title="Refresh Orders Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </AdminPageHeader>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            className="p-4 rounded-xl border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Total Orders</span>
              <Receipt className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-neutral-900 dark:text-neutral-100">
              {counts.all}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Scoped volume</div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs text-amber-500 font-medium">
              <span>Pending</span>
              <AlertCircle className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
              {counts.pending}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Awaiting confirm</div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs text-purple-500 font-medium">
              <span>Kitchen Prep</span>
              <ChefHat className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-purple-600 dark:text-purple-400">
              {counts.preparing}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Active on KDS</div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs text-emerald-500 font-medium">
              <span>Ready for Guest</span>
              <BellRing className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
              {counts.ready}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Dispatch ready</div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between shadow-xs col-span-2 sm:col-span-1"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Total Volume GMV</span>
              <CreditCard className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-neutral-900 dark:text-neutral-100">
              {formatAmount(counts.totalGmv).formatted}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Gross settled volume</div>
          </div>
        </div>

        {/* Real Top Tabs: Live Stream vs. Order History */}
        <div
          className="rounded-xl border shadow-xs overflow-hidden"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Main Tab Navigation Bar */}
          <div
            className="flex items-center border-b px-4"
            style={{ borderColor: 'var(--adm-border)' }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('LIVE_STREAM');
                setLiveStatusFilter('ALL');
                setPage(1);
              }}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'LIVE_STREAM'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-500" />
              <span>Live Orders Stream</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                {counts.active} Active
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ORDER_HISTORY');
                setHistoryStatusFilter('ALL');
                setPage(1);
              }}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'ORDER_HISTORY'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <History className="w-4 h-4 text-indigo-500" />
              <span>Order History &amp; Ledger</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold">
                {counts.completed + counts.cancelled} Records
              </span>
            </button>
          </div>

          {/* Sub-Filters Section */}
          <div className="p-4 space-y-3">
            {/* Live Stream Tab Controls */}
            {activeTab === 'LIVE_STREAM' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Live Status Stages */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase text-neutral-400 mr-1">
                    Live Status:
                  </span>
                  {[
                    { id: 'ALL', label: `All Active (${counts.active})` },
                    { id: 'PENDING', label: `Pending (${counts.pending})` },
                    { id: 'CONFIRMED', label: `Confirmed (${counts.confirmed})` },
                    { id: 'PREPARING', label: `Kitchen Prep (${counts.preparing})` },
                    { id: 'READY', label: `Ready for Guest (${counts.ready})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setLiveStatusFilter(tab.id);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        liveStatusFilter === tab.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                          : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search Order #, customer..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
                    style={{
                      backgroundColor: 'var(--adm-surface-subtle)',
                      borderColor: 'var(--adm-border)',
                      color: 'var(--adm-text)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Order History Tab Controls */}
            {activeTab === 'ORDER_HISTORY' && (
              <div className="space-y-3">
                {/* Row 1: Status Filter + Search bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase text-neutral-400 mr-1">
                      Filter Status:
                    </span>
                    {[
                      { id: 'ALL', label: `All Past Orders (${counts.completed + counts.cancelled})` },
                      { id: 'COMPLETED', label: `Completed (${counts.completed})` },
                      { id: 'CANCELLED', label: `Cancelled (${counts.cancelled})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setHistoryStatusFilter(tab.id);
                          setPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          historyStatusFilter === tab.id
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search historical orders..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
                      style={{
                        backgroundColor: 'var(--adm-surface-subtle)',
                        borderColor: 'var(--adm-border)',
                        color: 'var(--adm-text)',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Date Filters */}
                <div
                  className="pt-2.5 border-t flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 text-xs"
                  style={{ borderColor: 'var(--adm-border)' }}
                >
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <span className="text-neutral-400 font-semibold flex items-center gap-1 mr-1 text-[11px] whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5" /> Date Range:
                    </span>
                    {(
                      [
                        { id: 'ALL', label: 'All Time' },
                        { id: 'TODAY', label: 'Today' },
                        { id: 'YESTERDAY', label: 'Yesterday' },
                        { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                        { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
                        { id: 'CUSTOM', label: 'Custom' },
                      ] as { id: DatePreset; label: string }[]
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setDatePreset(preset.id);
                          setPage(1);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                          datePreset === preset.id
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent font-bold'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {datePreset === 'CUSTOM' && (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-neutral-400">From:</span>
                        <AdminDatePicker
                          ariaLabel="Start Date"
                          placeholder="Start date"
                          value={customStartDate}
                          max={customEndDate || undefined}
                          onChange={(val) => {
                            setCustomStartDate(val);
                            setPage(1);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-neutral-400">To:</span>
                        <AdminDatePicker
                          ariaLabel="End Date"
                          placeholder="End date"
                          value={customEndDate}
                          min={customStartDate || undefined}
                          onChange={(val) => {
                            setCustomEndDate(val);
                            setPage(1);
                          }}
                          align="right"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Orders Table Container */}
          <div className="border-t" style={{ borderColor: 'var(--adm-border)' }}>
            {isLoading ? (
              <div className="p-16 text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                  Loading {activeTab === 'LIVE_STREAM' ? 'live stream queue' : 'order audit ledger'}...
                </p>
              </div>
            ) : isError ? (
              <div className="p-16 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Failed to load orders
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {(error as any)?.message || 'An error occurred while fetching orders.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            ) : displayOrders.length === 0 ? (
              <div className="p-16 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-400" />
                <h3 className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                  No Orders Found
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--adm-muted)' }}>
                  {activeTab === 'LIVE_STREAM'
                    ? 'No active orders currently awaiting preparation or dispatch in this scope.'
                    : 'No past order records match the active date range or search query.'}
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
                      <th className="py-3 px-4">Order # &amp; Type</th>
                      <th className="py-3 px-4">Brand / Outlet</th>
                      <th className="py-3 px-4">Table / Guest</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4">Status Progress</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                    {displayOrders.map((order) => {
                      const statusConfig = STATUS_BADGES[order.status] || STATUS_BADGES.PENDING;
                      const formattedTotal = formatAmount(order.totalAmount);

                      return (
                        <tr
                          key={order.id}
                          className="hover:opacity-95 transition-colors cursor-pointer group"
                          style={{ backgroundColor: 'transparent' }}
                          onClick={() => setSelectedOrder(order)}
                        >
                          {/* Order # & Type */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                #{order.orderNumber}
                              </span>
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: 'var(--adm-surface-subtle)',
                                  borderColor: 'var(--adm-border)',
                                  color: 'var(--adm-text)',
                                }}
                              >
                                {order.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                              </span>
                            </div>
                          </td>

                          {/* Brand & Outlet */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                                <Store className="w-3 h-3 text-amber-500" />
                                {order.restaurantName}
                              </span>
                              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                                {order.branchName}
                              </span>
                            </div>
                          </td>

                          {/* Table / Guest */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                {order.tableNumber || 'Counter'}
                              </span>
                              <span className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                                {order.customerName} &bull; {order.customerPhone}
                              </span>
                            </div>
                          </td>

                          {/* Items Summary */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col max-w-[180px]">
                              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </td>

                          {/* Status Progress */}
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  statusMutation.mutate({
                                    orderId: order.id,
                                    status: e.target.value as OrderStatus,
                                  })
                                }
                                className="text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none"
                                style={{
                                  backgroundColor: statusConfig.bg,
                                  color: statusConfig.text,
                                  borderColor: statusConfig.border,
                                }}
                              >
                                <option
                                  value="PENDING"
                                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                                >
                                  ⏳ Pending
                                </option>
                                <option
                                  value="CONFIRMED"
                                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                                >
                                  ✓ Confirmed
                                </option>
                                <option
                                  value="PREPARING"
                                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                                >
                                  🍳 Preparing
                                </option>
                                <option
                                  value="READY"
                                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                                >
                                  🔔 Ready
                                </option>
                                <option
                                  value="COMPLETED"
                                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                                >
                                  ✔ Completed
                                </option>
                                <option
                                  value="CANCELLED"
                                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                                >
                                  ✕ Cancelled
                                </option>
                              </select>
                            </div>
                          </td>

                          {/* Payment Method & Status */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                                {order.paymentMethod}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  order.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-amber-500'
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>
                          </td>

                          {/* Total Amount */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                              {formattedTotal.formatted}
                            </span>
                          </td>

                          {/* Time Placed */}
                          <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              {formatElapsed(order.createdAt)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                              style={{
                                backgroundColor: 'var(--adm-surface-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: 'var(--adm-text)',
                              }}
                              title="Inspect Order Ticket"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ticket</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Component */}
            <AdminPagination
              currentPage={page}
              totalPages={paginationInfo.totalPages}
              totalItems={paginationInfo.totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemName="orders"
            />
          </div>
        </div>

        {/* Order Details / Kitchen Ticket Drawer Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div
              className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              {/* Header */}
              <div
                className="p-5 border-b flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold">
                      Order #{selectedOrder.orderNumber}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: STATUS_BADGES[selectedOrder.status].bg,
                        color: STATUS_BADGES[selectedOrder.status].text,
                        borderColor: STATUS_BADGES[selectedOrder.status].border,
                      }}
                    >
                      {STATUS_BADGES[selectedOrder.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {selectedOrder.restaurantName} &bull; {selectedOrder.branchName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg hover:opacity-80 transition-opacity cursor-pointer text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Customer & Dining Details */}
                <div
                  className="p-3 rounded-xl border grid grid-cols-2 gap-3"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Guest Name</span>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedOrder.customerName}
                    </p>
                    <p className="text-neutral-500 text-[11px]">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Location</span>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedOrder.tableNumber || 'Counter Service'}
                    </p>
                    <p className="text-neutral-500 text-[11px]">
                      {selectedOrder.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                    </p>
                  </div>
                </div>

                {/* Items Manifest */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Ordered Dishes ({selectedOrder.items.length})
                  </h4>
                  <div
                    className="rounded-xl border divide-y overflow-hidden"
                    style={{ borderColor: 'var(--adm-border)' }}
                  >
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between"
                        style={{ backgroundColor: 'var(--adm-surface)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-indigo-500 font-mono w-5">
                            {item.quantity}x
                          </span>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {item.name}
                            </p>
                            {item.itemNotes && (
                              <p className="text-[10px] text-neutral-400 italic">
                                Note: {item.itemNotes}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-mono font-bold">
                          {formatAmount(item.totalPrice).formatted}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Summary */}
                <div
                  className="p-3.5 rounded-xl border space-y-1.5 font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span>{formatAmount(selectedOrder.subtotal).formatted}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Tax</span>
                    <span>{formatAmount(selectedOrder.tax).formatted}</span>
                  </div>
                  <div
                    className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 pt-2 border-t text-sm"
                    style={{ borderColor: 'var(--adm-border)' }}
                  >
                    <span>Total Amount</span>
                    <span>{formatAmount(selectedOrder.totalAmount).formatted}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div
                className="p-4 border-t flex items-center justify-between gap-2"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div className="text-[11px] text-neutral-500">
                  Payment: <strong>{selectedOrder.paymentMethod}</strong> ({selectedOrder.paymentStatus})
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: 'CONFIRMED',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: 'PREPARING',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      Start Cooking
                    </button>
                  )}
                  {selectedOrder.status === 'PREPARING' && (
                    <button
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: 'READY',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs cursor-pointer hover:bg-emerald-700 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {selectedOrder.status === 'READY' && (
                    <button
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          orderId: selectedOrder.id,
                          status: 'COMPLETED',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Complete Order
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--adm-surface)',
                      borderColor: 'var(--adm-border)',
                      color: 'var(--adm-text)',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
