import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  Bell,
  Check,
  RotateCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Utensils,
  ShoppingBag,
  Store,
  Flame,
  Tv,
  Printer,
  CheckCircle2,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { ordersApi } from '../orders/api/ordersApi';
import type { Order } from '../orders/api/ordersApi';
import { KitchenTicketPrintModal } from './components/KitchenTicketPrintModal';
import { toast } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import {
  startContinuousAlarm,
  stopContinuousAlarm,
  playOrderChimeOnce,
  isSoundMuted,
  setSoundMuted,
} from '../../lib/audioAlert';

export const KdsPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants } = useRestaurants();
  const { branches } = useBranches();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => isSoundMuted());
  const [now, setNow] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<'COOKING' | 'READY'>('COOKING');
  const [viewMode, setViewMode] = useState<'rows' | 'cards'>('rows');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Auto-select first restaurant
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const selectedRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0] || null;
  }, [restaurants, selectedRestaurantId]);

  // Tick every second for live kitchen duration timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch kitchen orders (CONFIRMED, PREPARING, READY)
  const fetchKitchenOrders = useCallback(async (showLoading = false) => {
    if (!selectedRestaurantId) return;
    if (showLoading) setIsRefreshing(true);

    try {
      // Get all active orders
      const res = await ordersApi.getOrders(selectedRestaurantId, {
        branchId: selectedBranchId === 'ALL' ? undefined : selectedBranchId,
      });

      // Filter only kitchen relevant statuses
      const kitchenOrders = res.orders.filter(
        (o) =>
          o.status === 'CONFIRMED' ||
          o.status === 'PREPARING' ||
          o.status === 'READY',
      );
      setOrders(kitchenOrders);
    } catch (err) {
      console.error('Failed to fetch KDS orders', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, [selectedRestaurantId, selectedBranchId]);

  useEffect(() => {
    fetchKitchenOrders(true);
    // Poll every 4 seconds for instant kitchen updates
    const interval = setInterval(() => {
      fetchKitchenOrders(false);
    }, 4000);

    const handleOrdersUpdated = () => {
      fetchKitchenOrders(false);
    };
    window.addEventListener('instadine:orders_updated', handleOrdersUpdated);
    window.addEventListener('instadine:new_order', handleOrdersUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('instadine:orders_updated', handleOrdersUpdated);
      window.removeEventListener('instadine:new_order', handleOrdersUpdated);
    };
  }, [fetchKitchenOrders]);

  // Status transitions
  const handleMarkReady = async (orderId: string, orderNumber: number) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'READY');
      toast.success(`Order #${orderNumber} marked Ready for Pickup! 🛎️`);
      fetchKitchenOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const handleCompleteOrder = async (orderId: string, orderNumber: number) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'COMPLETED');
      toast.success(`Order #${orderNumber} served and completed! ✅`);
      fetchKitchenOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete order');
    }
  };

  const handleRecallOrder = async (orderId: string, orderNumber: number) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'PREPARING');
      toast.info(`Order #${orderNumber} recalled to cooking queue.`);
      fetchKitchenOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to recall order');
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
    if (!next) {
      playOrderChimeOnce();
      toast.info('Kitchen chimes enabled');
    } else {
      toast.info('Kitchen chimes muted');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Listen to fullscreen changes (e.g. Esc key pressed)
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const filteredBranches = branches.filter(
    (b) => !selectedRestaurantId || b.restaurantId === selectedRestaurantId,
  );

  const cookingOrders = useMemo(
    () => orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING'),
    [orders],
  );

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === 'READY'),
    [orders],
  );

  // KDS Content Body (shared between Dashboard Layout and Fullscreen Mode)
  const kdsContent = (
    <div
      className={`space-y-6 flex flex-col font-sans select-none text-text ${
        isFullscreen ? 'p-4 sm:p-6 min-h-screen bg-bg text-text' : ''
      }`}
    >
      {/* Top Bar for Kitchen Display */}
      <div className="px-4 sm:px-6 py-3.5 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-4 shadow-xs transition-colors">
        {/* Left: Brand & Back to Dashboard */}
        <div className="flex items-center gap-3">
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-surface-2 text-muted hover:text-text transition-colors cursor-pointer"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-xs">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-text uppercase">
                  Kitchen Display System
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  KDS LIVE
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted">
                Real-time duration tracking & ticket expediting
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Clock & Queue Pill Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl border border-border bg-surface-2 font-mono text-sm font-bold text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <span>
              {new Date(now).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          {/* Quick tab counters for mobile/small displays */}
          <div className="inline-flex p-1 rounded-xl border border-border bg-surface-2">
            <button
              type="button"
              onClick={() => setActiveTab('COOKING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'COOKING'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Cooking ({cookingOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('READY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'READY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ready ({readyOrders.length})</span>
            </button>
          </div>
        </div>

        {/* Right: Controls & Branch Selector (Clean toolbar without redundant theme toggle) */}
        <div className="flex items-center gap-2">
          {/* Branch Filter */}
          {filteredBranches.length > 0 && (
            <div className="flex items-center gap-1.5 border border-border bg-surface-2 rounded-xl px-2.5 py-1 text-xs">
              <Store className="w-3.5 h-3.5 text-muted" />
              <select
                aria-label="Filter Outlet"
                className="bg-transparent border-none font-bold text-xs focus:outline-none cursor-pointer text-text"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="ALL" className="bg-surface text-text">
                  All Outlets
                </option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-surface text-text">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchKitchenOrders(true)}
            className="p-2 rounded-xl border border-border bg-surface-2 text-muted hover:text-text transition-colors cursor-pointer"
            title="Refresh tickets"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl transition-colors cursor-pointer border ${
              isMuted
                ? 'bg-surface-2 border-border text-muted hover:text-text'
                : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
            }`}
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* TV Board Link */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.TV_DISPLAY)}
            className="p-2 rounded-xl transition-colors cursor-pointer border border-border bg-surface-2 text-muted hover:text-primary hidden sm:flex items-center gap-1.5 text-xs font-bold"
            title="Open Customer Pickup TV Display"
          >
            <Tv className="w-4 h-4 text-primary" />
            <span className="hidden md:inline">TV Board</span>
          </button>

          {/* View Mode Toggle: Rows vs Cards */}
          <div className="hidden sm:flex items-center bg-surface-2 border border-border rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('rows')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'rows'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
              title="Row View (Expanded)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Rows</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-text'
              }`}
              title="Card View (Compact)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl transition-colors cursor-pointer border border-border bg-surface-2 text-muted hover:text-text hidden sm:block"
            title="Toggle Kitchen Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main KDS Grid Canvas */}
      <main className="flex-1">
        {/* Responsive Dual Column View on Large Screens or Active Tab on Small */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* COLUMN 1: In Kitchen / Preparing */}
          <section className={`space-y-4 ${activeTab !== 'COOKING' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Kitchen Queue ({cookingOrders.length})
                </h2>
              </div>
              <span className="text-xs font-mono text-muted">
                Live Duration Tracking
              </span>
            </div>

            {cookingOrders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface text-muted space-y-2">
                <ChefHat className="w-9 h-9 mx-auto opacity-30" />
                <p className="text-sm font-semibold">Kitchen is all caught up!</p>
                <p className="text-xs opacity-75">
                  New orders from the counter or tables will appear here automatically.
                </p>
              </div>
            ) : (
              <div className={viewMode === 'rows' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
                {cookingOrders.map((order) => (
                  <KitchenOrderTicket
                    key={order.id}
                    order={order}
                    now={now}
                    viewMode={viewMode}
                    onMarkReady={() => handleMarkReady(order.id, order.orderNumber)}
                    onPrint={() => setPrintingOrder(order)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* COLUMN 2: Ready for Pickup / Serving */}
          <section className={`space-y-4 ${activeTab !== 'READY' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Ready for Pickup ({readyOrders.length})
                </h2>
              </div>
              <span className="text-xs font-mono text-muted">
                Customer Notified
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface text-muted space-y-2">
                <Bell className="w-9 h-9 mx-auto opacity-30" />
                <p className="text-sm font-semibold">No orders waiting for pickup</p>
                <p className="text-xs opacity-75">
                  When dishes are marked ready, they will show here until collected.
                </p>
              </div>
            ) : (
              <div className={viewMode === 'rows' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
                {readyOrders.map((order) => (
                  <ReadyOrderTicket
                    key={order.id}
                    order={order}
                    viewMode={viewMode}
                    onComplete={() => handleCompleteOrder(order.id, order.orderNumber)}
                    onRecall={() => handleRecallOrder(order.id, order.orderNumber)}
                    onPrint={() => setPrintingOrder(order)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Kitchen Ticket Print Modal (ESC/POS Thermal Bridge) */}
      <KitchenTicketPrintModal
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
        order={printingOrder}
        restaurantName={selectedRestaurant?.name}
        branchName={branches.find((b) => b.id === printingOrder?.branchId)?.name}
      />
    </div>
  );

  // If in browser full-screen tablet mode, render directly to take up 100% of display
  if (isFullscreen) {
    return kdsContent;
  }

  // Normal mode: nicely framed inside DashboardLayout with sidebar & header
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-16">{kdsContent}</div>
    </DashboardLayout>
  );
};

// =========================================================================
// KITCHEN ORDER TICKET COMPONENT WITH LIVE RUNNING DURATION TIMER
// =========================================================================
interface KitchenOrderTicketProps {
  order: Order;
  now: number;
  viewMode?: 'rows' | 'cards';
  onMarkReady: () => void;
  onPrint: () => void;
}

const KitchenOrderTicket: React.FC<KitchenOrderTicketProps> = ({
  order,
  now,
  viewMode = 'rows',
  onMarkReady,
  onPrint,
}) => {
  const isDineIn = order.orderType === 'DINE_IN';

  // Duration calculation
  const startTimeMs = order.prepStartedAt
    ? new Date(order.prepStartedAt).getTime()
    : new Date(order.createdAt).getTime();

  const targetMinutes = order.prepTimeMinutes || 15;
  const targetDurationMs = targetMinutes * 60 * 1000;
  const elapsedMs = Math.max(0, now - startTimeMs);

  const elapsedSec = Math.floor(elapsedMs / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedSecMod = elapsedSec % 60;
  const formattedElapsed = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSecMod).padStart(2, '0')}`;

  // Color warning thresholds:
  // Green: 0% - 75%
  // Amber: 75% - 100%
  // Red / Flashing: > 100% (Overdue)
  const ratio = elapsedMs / targetDurationMs;
  const isOverdue = ratio >= 1.0;
  const isWarning = ratio >= 0.75 && !isOverdue;

  // Overdue extra duration
  const overdueSec = Math.max(0, Math.floor((elapsedMs - targetDurationMs) / 1000));
  const overdueMin = Math.floor(overdueSec / 60);
  const overdueSecMod = overdueSec % 60;
  const formattedOverdue = `+${overdueMin}:${String(overdueSecMod).padStart(2, '0')}`;

  if (viewMode === 'rows') {
    return (
      <div
        className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
          isOverdue
            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-400/40'
            : isWarning
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-400/40'
            : 'bg-surface border-border hover:border-primary/40'
        }`}
      >
        {/* Ticket Header Banner */}
        <div
          className={`px-4 py-2 flex items-center justify-between border-b ${
            isOverdue
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
              : isWarning
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30'
              : 'bg-surface-2 text-text border-border'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xl font-black tracking-tight shrink-0">
              #{order.orderNumber}
            </span>
            <span className="text-muted/60 font-light">•</span>
            <span className="font-bold text-xs truncate max-w-[120px] sm:max-w-[180px]">
              {order.customerName || 'Guest'}
            </span>
            <span className="text-muted/60 font-light">•</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface border border-border text-xs font-bold shrink-0">
              {isDineIn ? (
                <>
                  <Utensils className="w-3 h-3 text-primary" />
                  <span>Table {order.tableNumber || '-'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3 text-primary" />
                  <span>Takeaway</span>
                </>
              )}
            </span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${order.paymentMethod === 'UPI' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-surface border-border text-muted'}`}>
              {order.paymentMethod === 'UPI' ? 'UPI' : 'Cash'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 font-mono text-xs font-black">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{formattedElapsed} / {targetMinutes}m</span>
            </div>
            {isOverdue ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/40 text-white animate-pulse">
                {formattedOverdue} OVERDUE
              </span>
            ) : isWarning ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                EXPEDITE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                ON TIME
              </span>
            )}
          </div>
        </div>

        {/* Content Row: Dishes List and Action Buttons */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-primary/15 text-primary dark:text-primary-foreground font-black text-xs font-mono">
                    {item.quantity}×
                  </span>
                  <span className="font-bold text-text truncate">
                    {item.product?.name || item.productName}
                  </span>
                  {item.notes && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 italic bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      "{item.notes}"
                    </span>
                  )}
                </div>
              ))}
            </div>

            {order.orderNotes && (
              <p className="text-xs text-amber-800 dark:text-amber-300 italic pt-1 border-t border-border/40">
                <span className="font-bold not-italic">Note: </span>"{order.orderNotes}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onPrint}
              className="h-9 px-3 rounded-xl border border-border bg-surface-2 hover:bg-surface text-text font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Print Kitchen Ticket (KOT)"
            >
              <Printer className="w-3.5 h-3.5 text-muted" />
              <span>KOT</span>
            </button>

            <button
              type="button"
              onClick={onMarkReady}
              className="h-9 px-3.5 rounded-xl font-black text-xs bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap tracking-wide"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Ready</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Card view fallback
  return (
    <div
      className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
        isOverdue
          ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/40'
          : isWarning
          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-400/40'
          : 'bg-surface border-border'
      }`}
    >
      <div>
        {/* Ticket Header Banner: Timer & Target */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isOverdue
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
              : isWarning
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30'
              : 'bg-surface-2 text-text border-border'
          }`}
        >
          {/* Running Duration */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-black">
            <Clock className="w-3.5 h-3.5 shrink-0 text-primary animate-pulse" />
            <span>
              {formattedElapsed} / {targetMinutes}m
            </span>
          </div>

          {/* Warning Badge */}
          {isOverdue ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 text-white">
              {formattedOverdue} OVERDUE
            </span>
          ) : isWarning ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              EXPEDITE
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              ON TIME
            </span>
          )}
        </div>

        {/* Ticket Header: Order Number & Table Badge */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <span className="font-mono text-3xl font-black tracking-tight text-text">
              #{order.orderNumber}
            </span>
            <p className="text-xs font-semibold text-muted mt-0.5">
              {order.customerName || 'Guest'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/25 bg-primary/10 text-primary font-bold text-xs shadow-2xs">
            {isDineIn ? (
              <>
                <Utensils className="w-3.5 h-3.5" />
                <span>Table {order.tableNumber || '-'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway</span>
              </>
            )}
          </div>
        </div>

        {/* Dishes Breakdown for Kitchen Chefs */}
        <div className="p-4 space-y-2.5">
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-border bg-surface-2 flex items-start gap-2.5 text-xs"
              >
                <span className="shrink-0 min-w-6 px-1.5 py-0.5 rounded-md bg-primary text-on-primary font-black text-xs text-center shadow-2xs">
                  {item.quantity}×
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-text leading-snug">
                    {item.product?.name || item.productName}
                  </div>
                  {item.notes && (
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-1 italic py-0.5 px-2 rounded border border-amber-500/20 bg-amber-500/10">
                      Note: "{item.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Customer General Note */}
          {order.orderNotes && (
            <div className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold">Special Instructions: </span>
              <span className="font-medium italic">"{order.orderNotes}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Footer Action Button */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="h-11 px-3.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-text font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
          title="Print Kitchen Ticket (KOT)"
        >
          <Printer className="w-4 h-4 text-muted" />
          <span>KOT</span>
        </button>

        <button
          type="button"
          onClick={onMarkReady}
          className="flex-1 h-11 px-4 rounded-xl font-black text-xs sm:text-sm bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap tracking-wide"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Mark Ready</span>
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// READY ORDER TICKET COMPONENT
// =========================================================================
interface ReadyOrderTicketProps {
  order: Order;
  viewMode?: 'rows' | 'cards';
  onComplete: () => void;
  onRecall: () => void;
  onPrint: () => void;
}

const ReadyOrderTicket: React.FC<ReadyOrderTicketProps> = ({
  order,
  viewMode = 'rows',
  onComplete,
  onRecall,
  onPrint,
}) => {
  const isDineIn = order.orderType === 'DINE_IN';

  if (viewMode === 'rows') {
    return (
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-surface flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all">
        {/* Ready Header Banner */}
        <div className="px-4 py-2 bg-emerald-600 text-white flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xl font-black tracking-tight shrink-0">
              #{order.orderNumber}
            </span>
            <span className="text-white/60 font-light">•</span>
            <span className="font-bold text-xs truncate max-w-[120px] sm:max-w-[180px]">
              {order.customerName || 'Guest'}
            </span>
            <span className="text-white/60 font-light">•</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/20 text-white text-xs font-bold shrink-0">
              {isDineIn ? (
                <>
                  <Utensils className="w-3 h-3" />
                  <span>Table {order.tableNumber || '-'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3" />
                  <span>Takeaway</span>
                </>
              )}
            </span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${order.paymentMethod === 'UPI' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-surface border-border text-muted'}`}>
              {order.paymentMethod === 'UPI' ? 'UPI' : 'Cash'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider shrink-0">
            <Bell className="w-3 h-3 animate-bounce" />
            <span>READY FOR PICKUP</span>
          </div>
        </div>

        {/* Content Row: Dishes List and Action Buttons */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black text-xs font-mono">
                  {item.quantity}×
                </span>
                <span className="font-bold text-text truncate">
                  {item.product?.name || item.productName}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onPrint}
              className="h-9 px-3 rounded-xl border border-border bg-surface-2 hover:bg-surface text-text font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Print Kitchen Ticket (KOT)"
            >
              <Printer className="w-3.5 h-3.5 text-muted" />
              <span>KOT</span>
            </button>

            <button
              type="button"
              onClick={onRecall}
              className="h-9 px-2.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-muted hover:text-text font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Recall back to cooking queue"
            >
              <span>Recall</span>
            </button>

            <button
              type="button"
              onClick={onComplete}
              className="h-9 px-3.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap tracking-wide"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Complete</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Card view fallback
  return (
    <div className="rounded-2xl border-2 border-emerald-400 dark:border-emerald-500/40 bg-surface flex flex-col justify-between overflow-hidden shadow-xs">
      <div>
        {/* Top Banner */}
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Ready for Pickup</span>
          </div>
          <span className="text-[10px] bg-black/25 px-2.5 py-0.5 rounded-full font-bold">
            Customer Notified
          </span>
        </div>

        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <span className="font-mono text-3xl font-black tracking-tight text-text">
              #{order.orderNumber}
            </span>
            <p className="text-xs font-semibold text-muted mt-0.5">
              {order.customerName || 'Guest'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs shadow-2xs">
            {isDineIn ? (
              <>
                <Utensils className="w-3.5 h-3.5" />
                <span>Table {order.tableNumber || '-'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Takeaway</span>
              </>
            )}
          </div>
        </div>

        {/* Dishes Summary */}
        <div className="p-4 space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl border border-border bg-surface-2 flex items-start gap-2.5 text-xs"
            >
              <span className="shrink-0 min-w-6 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-xs text-center border border-emerald-500/30">
                {item.quantity}×
              </span>
              <span className="font-bold text-text self-center">
                {item.product?.name || item.productName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="h-11 px-3.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-text font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Print Kitchen Ticket (KOT)"
          >
            <Printer className="w-4 h-4 text-muted" />
            <span>KOT</span>
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="flex-1 h-11 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap tracking-wide"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Complete</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRecall}
          className="w-full py-1 text-xs text-center text-muted hover:text-text transition-colors cursor-pointer"
        >
          Recall back to cooking queue
        </button>
      </div>
    </div>
  );
};
