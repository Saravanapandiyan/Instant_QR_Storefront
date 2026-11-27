import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Tv,
  Flame,
  Bell,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  RotateCw,
  Utensils,
  ShoppingBag,
  Store,
  Share2,
  ArrowLeft,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { getOwnerSocket } from '../../lib/socket';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { ordersApi, type TvBoardOrder } from '../orders/api/ordersApi';
import {
  speakOrderReady,
  playReadyChime,
  isVoiceMuted,
  setVoiceMuted,
  isSoundMuted,
  setSoundMuted,
} from '../../lib/audioAlert';
import { toast } from '../../components/ui';
import { ROUTES } from '../../constants/routes';

export const TvDisplayPage: React.FC = () => {
  const navigate = useNavigate();
  const { branchId: paramBranchId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const { restaurants } = useRestaurants();
  const { branches } = useBranches();

  // Selected scope
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    paramBranchId || searchParams.get('branchId') || 'ALL',
  );
  const [serverNames, setServerNames] = useState<{ restaurant: string; branch: string }>({
    restaurant: 'InstaDine Storefront',
    branch: 'Main Counter',
  });

  // Orders state
  const [orders, setOrders] = useState<TvBoardOrder[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return searchParams.get('mode') === 'tv' || searchParams.get('fullscreen') === 'true';
  });

  // Audio & Voice toggles
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(() => !isVoiceMuted());
  const [isChimeActive, setIsChimeActive] = useState<boolean>(() => !isSoundMuted());
  const [now, setNow] = useState<number>(Date.now());
  const [recentReadyIds, setRecentReadyIds] = useState<Set<string>>(new Set());

  // Track previous order statuses to trigger voice announcement on transition to READY
  const prevOrdersStatusRef = useRef<Map<string, string>>(new Map());
  const isInitialLoadRef = useRef<boolean>(true);

  // Auto-select first restaurant if not already set
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter branches for selected restaurant
  const filteredBranches = useMemo(() => {
    if (!selectedRestaurantId) return branches;
    return branches.filter((b) => b.restaurantId === selectedRestaurantId);
  }, [branches, selectedRestaurantId]);

  // Current display branch name
  const currentBranchName = useMemo(() => {
    if (selectedBranchId === 'ALL') return 'All Outlets';
    const found = branches.find((b) => b.id === selectedBranchId);
    return found ? found.name : serverNames.branch;
  }, [branches, selectedBranchId, serverNames.branch]);

  // Current restaurant name
  const currentRestaurantName = useMemo(() => {
    const found = restaurants.find((r) => r.id === selectedRestaurantId);
    return found ? found.name : serverNames.restaurant;
  }, [restaurants, selectedRestaurantId, serverNames.restaurant]);

  // Fetch active TV board orders
  const fetchBoardOrders = useCallback(async (showLoading = false) => {
    const target =
      selectedBranchId !== 'ALL' && selectedBranchId
        ? selectedBranchId
        : (selectedRestaurantId || paramBranchId || searchParams.get('branchId'));

    if (!target) return;
    if (showLoading) setIsRefreshing(true);

    try {
      const res = await ordersApi.getTvBoardOrders(target);
      if (res.restaurantName || res.branchName) {
        setServerNames({
          restaurant: res.restaurantName || 'InstaDine Storefront',
          branch: res.branchName || 'Main Counter',
        });
      }
      const fetched = res.orders || [];

      // Check for newly READY orders to trigger audio callout
      const newlyReady: TvBoardOrder[] = [];

      fetched.forEach((ord) => {
        const prevStatus = prevOrdersStatusRef.current.get(ord.id);
        // If this order just transitioned to READY (or is newly detected as READY after initial load)
        if (
          !isInitialLoadRef.current &&
          ord.status === 'READY' &&
          prevStatus &&
          prevStatus !== 'READY'
        ) {
          newlyReady.push(ord);
        }
        prevOrdersStatusRef.current.set(ord.id, ord.status);
      });

      // Announce each newly ready order
      if (newlyReady.length > 0) {
        newlyReady.forEach((readyOrd) => {
          speakOrderReady(readyOrd.orderNumber, readyOrd.customerName);
          setRecentReadyIds((prev) => new Set([...prev, readyOrd.id]));
        });

        // Clear pulse effect after 25 seconds
        setTimeout(() => {
          setRecentReadyIds((prev) => {
            const next = new Set(prev);
            newlyReady.forEach((r) => next.delete(r.id));
            return next;
          });
        }, 25000);
      }

      if (isInitialLoadRef.current) {
        // Record all current order statuses on first load without blaring audio
        fetched.forEach((ord) => {
          prevOrdersStatusRef.current.set(ord.id, ord.status);
        });
        isInitialLoadRef.current = false;
      }

      setOrders(fetched);
    } catch (err) {
      console.error('Failed to fetch TV board orders:', err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  }, [selectedRestaurantId, selectedBranchId]);

  // Initial fetch and Socket.IO subscription for instant TV pickup updates
  useEffect(() => {
    const queryBranchId = searchParams.get('branchId');
    const targetBranchId = paramBranchId || queryBranchId || (selectedBranchId !== 'ALL' ? selectedBranchId : null);
    const hasTarget = selectedRestaurantId || targetBranchId;
    if (!hasTarget) return;

    fetchBoardOrders(true);

    const socket = getOwnerSocket();
    const joinRooms = () => {
      if (selectedRestaurantId) {
        socket.emit('join:restaurant', { restaurantId: selectedRestaurantId });
      }
      if (targetBranchId) {
        socket.emit('join:branch', { branchId: targetBranchId });
      }
    };
    const handleSocketOrder = () => {
      fetchBoardOrders(false);
    };
    const handleReconnect = () => {
      joinRooms();
      fetchBoardOrders(false);
    };

    joinRooms();
    socket.on('order:created', handleSocketOrder);
    socket.on('order:updated', handleSocketOrder);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('order:created', handleSocketOrder);
      socket.off('order:updated', handleSocketOrder);
      socket.off('connect', handleReconnect);
      if (selectedRestaurantId) {
        socket.emit('leave:restaurant', { restaurantId: selectedRestaurantId });
      }
      if (targetBranchId) {
        socket.emit('leave:branch', { branchId: targetBranchId });
      }
    };
  }, [fetchBoardOrders, selectedRestaurantId, selectedBranchId, paramBranchId, searchParams]);

  // Split into Cooking vs Ready
  const cookingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING',
    );
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'READY');
  }, [orders]);

  // Audio toggles
  const handleToggleVoice = () => {
    const next = !isVoiceActive;
    setIsVoiceActive(next);
    setVoiceMuted(!next);
    if (next) {
      toast.success('Voice Callout Enabled 🗣️');
    } else {
      toast.info('Voice Callout Muted');
    }
  };

  const handleToggleChime = () => {
    const next = !isChimeActive;
    setIsChimeActive(next);
    setSoundMuted(!next);
    if (next) {
      playReadyChime();
      toast.success('Ready Bell Chime Enabled 🛎️');
    } else {
      toast.info('Ready Chime Muted');
    }
  };

  // Fullscreen management
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

  // Listen to Esc / Fullscreen change
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard shortcut 'F' to toggle fullscreen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA' &&
          document.activeElement?.tagName !== 'SELECT'
        ) {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Copy TV link for standalone screens
  const handleCopyTvLink = () => {
    const targetBranch = selectedBranchId !== 'ALL' ? selectedBranchId : filteredBranches[0]?.id || '';
    const origin = window.location.origin;
    const url = targetBranch
      ? `${origin}/tv?branchId=${targetBranch}&mode=tv`
      : `${origin}/tv?mode=tv`;
    navigator.clipboard.writeText(url);
    toast.success('Direct TV Display Link copied! Open on any Smart TV or display browser.');
  };

  // TV Main Content Layout
  const tvBoardContent = (
    <div
      className={`flex flex-col font-sans select-none text-text transition-colors ${
        isFullscreen ? 'p-4 sm:p-6 min-h-screen bg-bg text-text' : 'space-y-6'
      }`}
    >
      {/* Top TV Header Bar */}
      <div className="px-5 py-3 rounded-2xl bg-surface border border-border flex items-center justify-between gap-4 shadow-xs select-none">
        {/* Brand & Outlet Info */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-text uppercase whitespace-nowrap">
                {currentRestaurantName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <Store className="w-3 h-3 text-primary shrink-0" />
              <span>{currentBranchName}</span>
              <span className="text-muted/60">•</span>
              <span>Pickup Board</span>
            </p>
          </div>
        </div>

        {/* Center: Clean Digital Clock */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-xl bg-surface-2 border border-border shadow-2xs font-mono shrink-0">
          <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-lg font-black tracking-wider text-text">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s*(AM|PM)/i, '')}
          </span>
          <span className="text-xs font-bold text-muted">
            :{String(new Date(now).getSeconds()).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-black uppercase text-primary ml-1">
            {new Date(now).getHours() >= 12 ? 'PM' : 'AM'}
          </span>
        </div>

        {/* Right: Sleek Unified TV Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Outlet Selector */}
          {filteredBranches.length > 0 && (
            <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-xl px-2.5 h-9 text-xs">
              <Store className="w-3.5 h-3.5 text-muted shrink-0" />
              <select
                aria-label="Select Outlet"
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

          {/* Voice Announcement Toggle */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isVoiceActive
                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                : 'bg-surface-2 border-border text-muted hover:text-text'
            }`}
            title={isVoiceActive ? 'Voice Announcement Active (Click to Mute)' : 'Voice Announcement Muted (Click to Enable)'}
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Chime Bell Toggle */}
          <button
            type="button"
            onClick={handleToggleChime}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isChimeActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-surface-2 border-border text-muted hover:text-text'
            }`}
            title={isChimeActive ? 'Ready Bell Active (Click to Mute)' : 'Ready Bell Muted (Click to Enable)'}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Share TV Link */}
          <button
            type="button"
            onClick={handleCopyTvLink}
            className="w-9 h-9 rounded-xl border border-border bg-surface-2 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
            title="Copy Public Smart TV Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchBoardOrders(true)}
            className="w-9 h-9 rounded-xl border border-border bg-surface-2 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl border border-border bg-surface-2 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen TV View (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit if opened in TV mode */}
          {isFullscreen && (
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                setIsFullscreen(false);
                navigate(ROUTES.DASHBOARD);
              }}
              className="w-9 h-9 rounded-xl border border-border bg-surface-2 text-muted hover:text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Dual-Column Order Display */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* ============================================================== */}
        {/* COLUMN 1: PREPARING / COOKING (Warm Amber Theme) */}
        {/* ============================================================== */}
        <section className="flex flex-col rounded-2xl bg-surface border border-border shadow-xs overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-amber-500/10 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Preparing
                </h2>
                <p className="text-[11px] font-semibold text-muted">
                  Cooking in Kitchen
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-500/25">
              {cookingOrders.length} In Progress
            </div>
          </div>

          {/* Orders List (Divided Horizontal Rows) */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-230px)] divide-y divide-border/60">
            {cookingOrders.length === 0 ? (
              <div className="py-20 sm:py-24 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                  <Flame className="w-6 h-6 text-amber-500/70" />
                </div>
                <h3 className="text-base font-bold text-text">
                  Kitchen is all caught up
                </h3>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  New dining or takeaway orders will appear here automatically.
                </p>
              </div>
            ) : (
              cookingOrders.map((ord) => {
                const elapsedSeconds = ord.prepStartedAt
                  ? Math.max(0, Math.floor((now - new Date(ord.prepStartedAt).getTime()) / 1000))
                  : 0;
                const mins = Math.floor(elapsedSeconds / 60);
                const secs = elapsedSeconds % 60;

                return (
                  <div
                    key={ord.id}
                    className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-surface-2/40"
                  >
                    {/* Left: Giant Order Number & Identity */}
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-3xl sm:text-4xl font-black text-amber-500 tracking-tight shrink-0 min-w-[70px]">
                        #{ord.orderNumber}
                      </span>

                      <div className="h-8 w-px bg-border/60 shrink-0" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base sm:text-lg font-bold text-text uppercase tracking-wide truncate">
                            {ord.customerName || 'Customer'}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-muted border border-border shrink-0">
                            {ord.orderType === 'DINE_IN' ? (
                              ord.tableNumber ? `Table ${ord.tableNumber}` : 'Dine-In'
                            ) : (
                              'Takeaway'
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-muted font-medium flex items-center gap-1.5 mt-0.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>In preparation</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Prep Timer */}
                    <div className="shrink-0 flex items-center gap-2">
                      {ord.prepStartedAt ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>{mins}:{secs < 10 ? `0${secs}` : secs}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-surface-2 text-muted border border-border">
                          Cooking
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* COLUMN 2: READY FOR PICKUP (Emerald Green Theme) */}
        {/* ============================================================== */}
        <section className="flex flex-col rounded-2xl bg-surface border border-emerald-500/30 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-emerald-500/10 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Ready For Pickup
                </h2>
                <p className="text-[11px] font-semibold text-muted">
                  Please collect at counter
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-500/25">
              {readyOrders.length} Ready
            </div>
          </div>

          {/* Orders List (Divided Horizontal Rows) */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-230px)] divide-y divide-border/60">
            {readyOrders.length === 0 ? (
              <div className="py-20 sm:py-24 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/70" />
                </div>
                <h3 className="text-base font-bold text-text">
                  All orders collected
                </h3>
                <p className="text-xs text-muted mt-1 max-w-xs">
                  Dishes marked ready will appear here with automatic audio callout announcements.
                </p>
              </div>
            ) : (
              readyOrders.map((ord) => {
                const isNewlyReady = recentReadyIds.has(ord.id);

                return (
                  <div
                    key={ord.id}
                    className={`px-5 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                      isNewlyReady
                        ? 'bg-emerald-500/15 animate-pulse'
                        : 'hover:bg-surface-2/40'
                    }`}
                  >
                    {/* Left: Giant Order Number & Identity */}
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight shrink-0 min-w-[70px]">
                        #{ord.orderNumber}
                      </span>

                      <div className="h-8 w-px bg-border/60 shrink-0" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base sm:text-lg font-bold text-text uppercase tracking-wide truncate">
                            {ord.customerName || 'Customer'}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-muted border border-border shrink-0">
                            {ord.orderType === 'DINE_IN' ? (
                              ord.tableNumber ? `Table ${ord.tableNumber}` : 'Dine-In'
                            ) : (
                              'Takeaway'
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Ready for pickup at counter</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Modern Airport-Style Status Beacon */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span>Ready at Counter</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      {/* Subtle Bottom Footer */}
      <footer className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted font-medium">
        <div className="flex items-center gap-2">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-text font-mono text-[10px] border border-border">
            F
          </kbd>
          <span>to toggle TV Fullscreen</span>
        </div>
        <div className="flex items-center gap-3">
          <span>InstaDine Real-time Order Engine</span>
          <span className="text-muted/60">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 animate-ping" />
            Audio Callout Active
          </span>
        </div>
      </footer>
    </div>
  );

  // In fullscreen mode, unauthenticated display, or TV standalone mode, render edge-to-edge without DashboardLayout
  if (!user || isFullscreen || searchParams.get('mode') === 'tv') {
    return tvBoardContent;
  }

  // Inside Owner Console Dashboard
  return <DashboardLayout>{tvBoardContent}</DashboardLayout>;
};
