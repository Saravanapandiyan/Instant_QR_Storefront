import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  ChefHat,
  ShoppingBag,
  Phone,
  RotateCw,
  Building2,
  Store,
  DollarSign,
  AlertTriangle,
  User,
  Check,
  Banknote,
  Utensils,
  Bell,
  MessageSquare,
  LayoutGrid,
  List,
  FileText,
  X,
  Lock,
  Calendar,
  Printer,
} from 'lucide-react';
import { getMediaUrl } from '../../lib/utils';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { ordersApi } from './api/ordersApi';
import type { Order, OrdersListResponse } from './api/ordersApi';
import { toast } from '../../components/ui';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { usePermissions } from '../../hooks/usePermissions';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';

type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeParams(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
): { startDate?: string; endDate?: string } {
  if (preset === 'ALL') return {};

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (preset === 'TODAY') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { startDate: startOfToday.toISOString(), endDate: endOfToday.toISOString() };
  }

  if (preset === 'YESTERDAY') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { startDate: startOfYesterday.toISOString(), endDate: endOfYesterday.toISOString() };
  }

  if (preset === 'THIS_WEEK') {
    // Monday start of current week
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
    return { startDate: startOfWeek.toISOString(), endDate: endOfToday.toISOString() };
  }

  if (preset === 'THIS_MONTH') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { startDate: startOfMonth.toISOString(), endDate: endOfToday.toISOString() };
  }

  // CUSTOM
  const result: { startDate?: string; endDate?: string } = {};
  if (customStart) {
    const s = new Date(`${customStart}T00:00:00`);
    if (!Number.isNaN(s.getTime())) result.startDate = s.toISOString();
  }
  if (customEnd) {
    const e = new Date(`${customEnd}T23:59:59.999`);
    if (!Number.isNaN(e.getTime())) result.endDate = e.toISOString();
  }
  return result;
}

export const OrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { restaurants } = useRestaurants();
  const { branches } = useBranches();
  const { formatPrice } = useCurrencyStore();
  const { can, isBranchAllowed } = usePermissions();

  const initialRestaurantParam = searchParams.get('restaurantId') || '';
  const initialBranchParam = searchParams.get('branchId') || 'ALL';
  const todayYMD = useMemo(() => formatLocalYMD(new Date()), []);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(initialRestaurantParam);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchParam);
  // Default tab is New Orders (PENDING) and default date filter is Today
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>(todayYMD);
  const [customEndDate, setCustomEndDate] = useState<string>(todayYMD);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [data, setData] = useState<OrdersListResponse>({
    counts: { all: 0, pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 },
    orders: [],
  });

  // Modal for cancellation
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Out of ingredients');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Modal for thermal receipt printing
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const printingRestaurant = useMemo(() => {
    if (!printingOrder) return null;
    return restaurants.find((r) => r.id === printingOrder.restaurantId) || null;
  }, [printingOrder, restaurants]);

  const printingBranch = useMemo(() => {
    if (!printingOrder) return null;
    return branches.find((b) => b.id === printingOrder.branchId) || null;
  }, [printingOrder, branches]);

  // Sync URL query params if user navigates from Overview branch card
  useEffect(() => {
    const rId = searchParams.get('restaurantId');
    const bId = searchParams.get('branchId');
    if (rId) setSelectedRestaurantId(rId);
    if (bId) setSelectedBranchId(bId);
  }, [searchParams]);

  // Auto-select restaurant
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Fetch orders
  const fetchOrders = useCallback(async (showLoading = false) => {
    if (!selectedRestaurantId) return;
    if (showLoading) setIsRefreshing(true);

    try {
      const dateParams = getDateRangeParams(datePreset, customStartDate, customEndDate);
      const res = await ordersApi.getOrders(selectedRestaurantId, {
        status: activeTab === 'ALL' ? undefined : activeTab,
        branchId: selectedBranchId === 'ALL' ? undefined : selectedBranchId,
        ...dateParams,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load orders', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, [selectedRestaurantId, selectedBranchId, activeTab, datePreset, customStartDate, customEndDate]);

  useEffect(() => {
    fetchOrders(true);
    // Polling every 5 seconds for live kitchen updates
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Status transitions
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setIsSubmittingAction(true);
    try {
      await ordersApi.updateOrderStatus(orderId, nextStatus);
      toast.success(`Order status updated to ${nextStatus}.`);
      await fetchOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Payment status update
  const handleTogglePayment = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    setIsSubmittingAction(true);
    try {
      await ordersApi.updatePaymentStatus(orderId, nextStatus as 'PAID' | 'PENDING');
      toast.success(
        nextStatus === 'PAID'
          ? 'Payment marked as Paid (Cash Collected).'
          : 'Payment marked as Pending.',
      );
      await fetchOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment status.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    const finalReason =
      cancelReason === 'Other' ? customReason.trim() || 'Cancelled by staff' : cancelReason;

    setIsSubmittingAction(true);
    try {
      await ordersApi.updateOrderStatus(cancellingOrder.id, 'CANCELLED', finalReason);
      toast.info(`Order #${cancellingOrder.orderNumber} cancelled.`);
      setCancellingOrder(null);
      await fetchOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredBranches = branches
    .filter((b) => !selectedRestaurantId || b.restaurantId === selectedRestaurantId)
    .filter((b) => isBranchAllowed(b.id));

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>New</span>
          </span>
        );
      case 'CONFIRMED':
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary-soft text-primary-soft-text border border-primary/20">
            <ChefHat className="w-3 h-3 text-primary" />
            <span>Kitchen</span>
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Bell className="w-3 h-3 text-emerald-600" />
            <span>Ready</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-surface-2 text-muted border border-border">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Done</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-danger/10 text-danger border border-danger/20">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout
      branchCount={branches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text">Live Orders</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live Kitchen Queue
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Real-time kitchen order dispatch, status updates, and physical cash settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Restaurant Selector */}
            {restaurants.length > 1 && (
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs hover:border-text/30 transition-colors">
                <Building2 className="w-3.5 h-3.5 text-muted" />
                <select
                  aria-label="Select Restaurant"
                  className="bg-transparent border-none text-text font-semibold focus:outline-none text-xs cursor-pointer"
                  value={selectedRestaurantId}
                  onChange={(e) => {
                    setSelectedRestaurantId(e.target.value);
                    setSelectedBranchId('ALL');
                  }}
                >
                  {restaurants.map((rest) => (
                    <option key={rest.id} value={rest.id} className="bg-surface text-text">
                      {rest.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Branch Selector */}
            {filteredBranches.length > 0 && (
              <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs hover:border-text/30 transition-colors">
                <Store className="w-3.5 h-3.5 text-muted" />
                <select
                  aria-label="Filter by Outlet"
                  className="bg-transparent border-none text-text font-semibold focus:outline-none text-xs cursor-pointer"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="ALL" className="bg-surface text-text">All Outlets</option>
                  {filteredBranches.map((br) => (
                    <option key={br.id} value={br.id} className="bg-surface text-text">
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface text-text shadow-xs font-bold'
                    : 'text-muted hover:text-text'
                }`}
                title="Compact Grid View (High Density)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface text-text shadow-xs font-bold'
                    : 'text-muted hover:text-text'
                }`}
                title="Table List View (Dense Queue)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Manual Refresh */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
              icon={<RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="rounded-xl shadow-xs text-xs font-bold"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Date Range Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted mr-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Date:</span>
            </span>
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: 'THIS_WEEK', label: 'This Week' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'CUSTOM', label: 'Custom Range' },
                { id: 'ALL', label: 'All Time' },
              ] as { id: DatePreset; label: string }[]
            ).map((preset) => {
              const isSelected = datePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDatePreset(preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface border-border text-muted hover:text-text hover:bg-surface-2'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {datePreset === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5 shadow-xs">
              <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                <span>From</span>
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || todayYMD}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <span className="text-xs text-muted">&rarr;</span>
              <label className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
                <span>To</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  max={todayYMD}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          )}
        </div>

        {/* Modern Segmented Tab Bar */}
        <div className="p-1 bg-surface-2 border border-border rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none shadow-xs">
          {[
            { id: 'PENDING', label: 'New Orders', count: data.counts.pending, alert: data.counts.pending > 0 },
            { id: 'PREPARING', label: 'In Kitchen', count: data.counts.preparing },
            { id: 'READY', label: 'Ready', count: data.counts.ready },
            { id: 'COMPLETED', label: 'Completed', count: data.counts.completed },
            { id: 'CANCELLED', label: 'Cancelled', count: data.counts.cancelled },
            { id: 'ALL', label: 'All Orders', count: data.counts.all },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface text-text shadow-sm border border-border'
                    : 'text-muted hover:text-text hover:bg-surface/60 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                    tab.alert
                      ? 'bg-primary text-white shadow-xs animate-pulse'
                      : isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface border border-border/70 text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {data.orders.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text">No orders in this category</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {activeTab === 'ALL'
                ? 'When customers scan your QR storefront and place cash orders, they will show up here instantly in real time.'
                : `There are currently no orders with status "${activeTab}".`}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* =========================================================================
             PRECISE MATCH: BESPOKE ORDER TICKET CARD (100% Theme Shades, No Hardcoding)
             ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {data.orders.map((order) => {
              const isPaid = order.paymentStatus === 'PAID';

              return (
                <div
                  key={order.id}
                  className="rounded-[24px] bg-surface border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Top Header Banner: Status pill on left, time on right */}
                    <div className="bg-surface-2 px-4 py-2.5 flex items-center justify-between border-b border-border">
                      <div>
                        {order.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-on-primary shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse" />
                            New Order
                          </span>
                        )}
                        {(order.status === 'CONFIRMED' || order.status === 'PREPARING') && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning text-white shadow-xs">
                            <ChefHat className="w-3 h-3 text-white" />
                            In Kitchen
                          </span>
                        )}
                        {order.status === 'READY' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success text-white shadow-xs">
                            <Bell className="w-3 h-3 text-white animate-bounce" />
                            Ready
                          </span>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface border border-border text-muted shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            Completed
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger text-on-danger shadow-xs">
                            <XCircle className="w-3 h-3 text-on-danger" />
                            Cancelled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrintingOrder(order)}
                          className="px-2 py-0.5 rounded-lg text-text bg-surface-2 hover:bg-border transition-colors border border-border flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          title="Print Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-primary" />
                          <span>Bill</span>
                        </button>

                        <div className="flex items-center gap-1 text-xs font-semibold text-muted">
                          <Clock className="w-3.5 h-3.5 text-muted" />
                          <span>
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Inner Content */}
                    <div className="p-4 space-y-3">
                      {/* Order Number & Table Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xl font-black text-text tracking-tight">
                          #{order.orderNumber}
                        </span>

                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-2 border border-border text-text text-xs font-bold shadow-2xs">
                          {order.orderType === 'DINE_IN' ? (
                            <>
                              <Utensils className="w-3.5 h-3.5 text-primary" />
                              <span>Table {order.tableNumber || '-'}</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                              <span>Takeaway</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                        <User className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="font-bold text-text">{order.customerName}</span>
                        {order.customerPhone && (
                          <>
                            <span>•</span>
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="text-muted hover:text-primary transition-colors"
                            >
                              {order.customerPhone}
                            </a>
                          </>
                        )}
                      </div>

                      {/* Dishes List with Thumbnails */}
                      <div className="space-y-2.5 pt-1">
                        {order.items.map((item) => {
                          const imageSrc = getMediaUrl(item.product?.imageUrl);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Thumbnail Image */}
                                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border/70 overflow-hidden shrink-0 flex items-center justify-center">
                                  {imageSrc ? (
                                    <img
                                      src={imageSrc}
                                      alt={item.productName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Utensils className="w-4 h-4 text-muted/50" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-text text-xs leading-tight truncate">
                                    {item.productName}
                                  </div>
                                  <div className="text-[11px] text-muted font-bold mt-0.5">
                                    x{item.quantity}
                                  </div>
                                </div>
                              </div>
                              <div className="font-bold text-text text-xs shrink-0">
                                {formatPrice(item.totalPrice)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Customer Note Box */}
                      {order.orderNotes && (
                        <div className="p-3 rounded-2xl bg-surface-2 border border-border text-xs">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                            <FileText className="w-3.5 h-3.5 text-muted" />
                            <span>Customer Note</span>
                          </div>
                          <p className="font-bold text-text text-xs mt-1">
                            "{order.orderNotes}"
                          </p>
                        </div>
                      )}

                      {/* Bill Breakdown */}
                      <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted">
                          <span>Items Total</span>
                          <span className="font-semibold text-text">{formatPrice(order.subtotal)}</span>
                        </div>
                        {Number(order.tax) > 0 && (
                          <div className="flex justify-between text-muted">
                            <span>Tax</span>
                            <span className="font-semibold text-text">{formatPrice(order.tax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="font-bold text-text text-sm">Total Bill</span>
                          <span className="font-black text-xl text-text tracking-tight">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                          <Lock className="w-3.5 h-3.5 text-muted" />
                          <span>Payment</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!can('orders', 'collectCash')) {
                              toast.error('You do not have permission to mark payment status.');
                              return;
                            }
                            handleTogglePayment(order.id, order.paymentStatus);
                          }}
                          disabled={isSubmittingAction || order.status === 'CANCELLED' || !can('orders', 'collectCash')}
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                            !can('orders', 'collectCash') ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            isPaid
                              ? 'bg-success/10 text-success border-success/20 hover:bg-success/15'
                              : 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/15'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                              <span>Cash Paid</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-warning" />
                              <span>Cash Pending</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        {order.status === 'PENDING' && can('orders', 'accept') && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            disabled={isSubmittingAction}
                            className="w-full py-2.5 px-4 rounded-2xl font-bold text-sm bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-on-primary" />
                            <span>Accept Order</span>
                          </button>
                        )}

                        {(order.status === 'CONFIRMED' || order.status === 'PREPARING') && can('orders', 'accept') && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                            disabled={isSubmittingAction}
                            className="w-full py-2.5 px-4 rounded-2xl font-bold text-sm bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <Bell className="w-4 h-4 text-on-primary" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {order.status === 'READY' && can('orders', 'accept') && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            disabled={isSubmittingAction}
                            className="w-full py-2.5 px-4 rounded-2xl font-bold text-sm bg-success hover:opacity-90 text-white shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-white" />
                            <span>Complete Order</span>
                          </button>
                        )}

                        {/* Print Receipt Action */}
                        <button
                          type="button"
                          onClick={() => setPrintingOrder(order)}
                          className="w-full py-2 px-3 rounded-xl border border-border bg-surface-2/70 hover:bg-surface-2 font-bold text-xs text-text flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-primary" />
                          <span>Print Receipt</span>
                        </button>

                        {/* Cancel Action */}
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && can('orders', 'cancel') && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingOrder(order);
                              setCancelReason('Out of ingredients');
                              setCustomReason('');
                            }}
                            disabled={isSubmittingAction}
                            className="w-full py-1 text-xs font-bold text-danger hover:underline flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-danger" />
                            <span>Cancel Order</span>
                          </button>
                        )}

                        {/* Cancelled reason */}
                        {order.status === 'CANCELLED' && (
                          <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger text-center font-semibold">
                            Cancelled: {order.cancelReason || 'By staff'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =========================================================================
             ULTRA-DENSE TABLE LIST VIEW (Fits 15+ orders on one single page)
             ========================================================================= */
          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-2 border-b border-border text-muted font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Dishes</th>
                    <th className="py-2.5 px-3">Bill</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.orders.map((order) => {
                    const isPaid = order.paymentStatus === 'PAID';
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-surface-2/60 transition-colors ${
                          order.status === 'PENDING' ? 'bg-warning/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-black text-text text-sm">
                          #{order.orderNumber}
                        </td>
                        <td className="py-2.5 px-3 text-muted text-[11px] whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-surface-2 text-text border border-border inline-flex items-center gap-1">
                            {order.orderType === 'DINE_IN' ? `Table ${order.tableNumber || '-'}` : 'Takeaway'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-text whitespace-nowrap">
                          <div>{order.customerName}</div>
                          {order.customerPhone && (
                            <div className="text-[10px] text-muted font-normal">
                              {order.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate font-medium text-text">
                          <span className="truncate block">
                            {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </span>
                          {order.orderNotes && (
                            <span className="text-[10px] text-warning italic block truncate">
                              "{order.orderNotes}"
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-black text-text whitespace-nowrap">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                isPaid
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-warning/10 text-warning border-warning/20'
                              }`}
                            >
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            {order.status !== 'CANCELLED' && can('orders', 'collectCash') && (
                              <button
                                type="button"
                                onClick={() => handleTogglePayment(order.id, order.paymentStatus)}
                                disabled={isSubmittingAction}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 hover:bg-border text-text border border-border transition-colors cursor-pointer"
                              >
                                {isPaid ? 'Unpay' : 'Collect'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="scale-90 origin-left">{getStatusBadge(order.status)}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPrintingOrder(order)}
                              className="p-1.5 rounded-lg text-text bg-surface-2 hover:bg-border transition-colors border border-border cursor-pointer"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-primary" />
                            </button>

                            {order.status === 'PENDING' && can('orders', 'accept') ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                              disabled={isSubmittingAction}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary shadow-xs cursor-pointer"
                            >
                              Accept
                            </button>
                          ) : (order.status === 'CONFIRMED' || order.status === 'PREPARING') && can('orders', 'accept') ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'READY')}
                              disabled={isSubmittingAction}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary shadow-xs cursor-pointer"
                            >
                              Ready
                            </button>
                          ) : order.status === 'READY' && can('orders', 'accept') ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                              disabled={isSubmittingAction}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-success hover:bg-success/90 text-white shadow-xs cursor-pointer"
                            >
                              Complete
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted italic">
                              {order.status === 'COMPLETED' ? 'Done' : order.status === 'CANCELLED' ? 'Cancelled' : 'View only'}
                            </span>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-danger">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text">
                    Cancel Order #{cancellingOrder.orderNumber}?
                  </h3>
                  <p className="text-xs text-muted">
                    This order will be cancelled immediately and marked in the system.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-text">Reason for cancellation</label>
                <div className="space-y-2">
                  {[
                    'Out of ingredients',
                    'Kitchen is busy / closed',
                    'Customer requested cancellation',
                    'Other',
                  ].map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2 cursor-pointer text-xs"
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={cancelReason === r}
                        onChange={() => setCancelReason(r)}
                        className="accent-primary"
                      />
                      <span className="text-text font-medium">{r}</span>
                    </label>
                  ))}
                </div>

                {cancelReason === 'Other' && (
                  <textarea
                    rows={2}
                    placeholder="Enter specific reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingOrder(null)}
                  disabled={isSubmittingAction}
                >
                  Keep Order
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmCancel}
                  isLoading={isSubmittingAction}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Thermal Receipt Print Modal */}
        <ThermalReceiptModal
          isOpen={Boolean(printingOrder)}
          onClose={() => setPrintingOrder(null)}
          order={printingOrder}
          restaurant={printingRestaurant}
          branch={printingBranch}
        />
      </div>
    </DashboardLayout>
  );
};
