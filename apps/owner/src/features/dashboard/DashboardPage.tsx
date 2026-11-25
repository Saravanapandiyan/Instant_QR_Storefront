import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Check,
  CheckCircle2,
  Circle,
  UtensilsCrossed,
  Clock,
  ChefHat,
  Bell,
  XCircle,
  ArrowRight,
  Printer,
  Sparkles,
  Plus,
  Coins,
  Utensils,
  ShoppingBag,
  Banknote,
  Smartphone,
  Store,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, toast } from '../../components/ui';
import { useBranches } from '../branches/hooks/useBranches';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { useActiveStore } from '../../store/useActiveStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { BranchModal } from '../branches/components/BranchModal';
import { InstagramQRModal } from '../branches/components/InstagramQRModal';
import { ThermalReceiptModal } from '../orders/components/ThermalReceiptModal';
import { QuickSetupWizard } from '../quick-setup/QuickSetupWizard';
import { getProducts, getCategories } from '../menu/api/menu-api';
import { ordersApi, type Order } from '../orders/api/ordersApi';
import { getCustomerStorefrontUrl } from '../../lib/urls';
import { ROUTES } from '../../constants/routes';
import type { Branch } from '@instant-qr/shared-types';

function isLocalToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [qrModalBranch, setQrModalBranch] = useState<Branch | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const { formatPrice } = useCurrencyStore();
  const { activeRestaurantId, activeBranchId, setActiveRestaurantId, setActiveBranchId } = useActiveStore();
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();

  // Fetch restaurants and branches
  const { restaurants, isLoading: isRestaurantsLoading } = useRestaurants();
  const { branches, isLoading: isBranchesLoading, createBranch } = useBranches();

  // Auto-open Quick Setup Wizard on first-time signup when owner has 0 branches
  useEffect(() => {
    if (!isBranchesLoading && !isRestaurantsLoading && branches.length === 0) {
      try {
        const isDismissed = sessionStorage.getItem('instadine_quick_setup_dismissed');
        if (!isDismissed) {
          setIsQuickSetupOpen(true);
        }
      } catch {
        setIsQuickSetupOpen(true);
      }
    }
  }, [isBranchesLoading, isRestaurantsLoading, branches.length]);

  // Filter state for viewing data by Restaurant Concept and Branch Outlet
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(() => activeRestaurantId || 'ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => activeBranchId || 'ALL');

  // Available branches for selected restaurant
  const availableBranchesForFilter = useMemo(() => {
    if (selectedRestaurantId === 'ALL') {
      return branches;
    }
    return branches.filter((b) => b.restaurantId === selectedRestaurantId);
  }, [branches, selectedRestaurantId]);

  const handleRestaurantFilterChange = (restId: string) => {
    setSelectedRestaurantId(restId);
    setActiveRestaurantId(restId === 'ALL' ? null : restId);
    setSelectedBranchId('ALL');
    setActiveBranchId(null);
  };

  const handleBranchFilterChange = (brId: string) => {
    setSelectedBranchId(brId);
    setActiveBranchId(brId === 'ALL' ? null : brId);
  };

  const filteredBranches = useMemo(() => {
    let list = branches;
    if (selectedRestaurantId !== 'ALL') {
      list = list.filter((b) => b.restaurantId === selectedRestaurantId);
    }
    if (selectedBranchId !== 'ALL') {
      list = list.filter((b) => b.id === selectedBranchId);
    }
    return list;
  }, [branches, selectedRestaurantId, selectedBranchId]);

  const restaurantIdsKey = restaurants.map((r) => r.id).sort().join(',');

  // Fetch real Digital Menu stats across restaurants
  const { data: menuStats, isLoading: isMenuLoading } = useQuery({
    queryKey: ['overview-menu-stats', user?.id, restaurantIdsKey],
    enabled: restaurants.length > 0 && !!user?.id,
    queryFn: async () => {
      const results = await Promise.all(
        restaurants.map(async (rest) => {
          const [prods, cats] = await Promise.all([
            getProducts(rest.id).catch(() => []),
            getCategories(rest.id).catch(() => []),
          ]);
          return { restaurantId: rest.id, productsCount: prods.length, categoriesCount: cats.length };
        }),
      );
      return results;
    },
  });

  const { totalDishes, totalCategories } = useMemo(() => {
    if (!menuStats || !Array.isArray(menuStats)) {
      return { totalDishes: 0, totalCategories: 0 };
    }
    const target = selectedRestaurantId === 'ALL'
      ? menuStats
      : menuStats.filter((m) => m.restaurantId === selectedRestaurantId);

    return {
      totalDishes: target.reduce((sum, m) => sum + m.productsCount, 0),
      totalCategories: target.reduce((sum, m) => sum + m.categoriesCount, 0),
    };
  }, [menuStats, selectedRestaurantId]);

  // Fetch real Orders across all restaurants (polling every 10s for live dashboard updates)
  const canViewOrders = can('orders', 'view');
  const { data: allOrders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['overview-orders', user?.id, restaurantIdsKey],
    enabled: restaurants.length > 0 && canViewOrders && !!user?.id,
    refetchInterval: 10000,
    queryFn: async () => {
      const responses = await Promise.all(
        restaurants.map((rest) =>
          ordersApi
            .getOrders(rest.id)
            .catch(() => ({
              counts: { all: 0, pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 },
              orders: [] as Order[],
            })),
        ),
      );
      return responses
        .flatMap((res) => res.orders || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });

  const handleCopyUrl = (slug: string) => {
    const fullUrl = getCustomerStorefrontUrl(slug);
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    toast.success('Customer storefront link copied!');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleQuickAcceptOrder = async (order: Order) => {
    setAcceptingOrderId(order.id);
    try {
      await ordersApi.updateOrderStatus(order.id, 'PREPARING');
      toast.success(`Order #${order.orderNumber} accepted into kitchen!`);
      await queryClient.invalidateQueries({ queryKey: ['overview-orders'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept order.');
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleGoToBranchMenu = (branch: Branch) => {
    setActiveRestaurantId(branch.restaurantId);
    setActiveBranchId(branch.id);
    navigate(`${ROUTES.MENU}?restaurantId=${branch.restaurantId}&branchId=${branch.id}`);
  };

  const handleGoToBranchOrders = (branch: Branch) => {
    setActiveRestaurantId(branch.restaurantId);
    setActiveBranchId(branch.id);
    navigate(`${ROUTES.ORDERS}?restaurantId=${branch.restaurantId}&branchId=${branch.id}`);
  };

  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (selectedRestaurantId !== 'ALL') {
      list = list.filter((o) => o.restaurantId === selectedRestaurantId);
    }
    if (selectedBranchId !== 'ALL') {
      list = list.filter((o) => o.branchId === selectedBranchId);
    }
    return list;
  }, [allOrders, selectedRestaurantId, selectedBranchId]);

  // Compute wired metrics
  const {
    activeBranchesCount,
    todayOrdersCount,
    totalValidOrdersCount,
    activeQueueOrdersCount,
    todayActiveQueueCount,
    totalVolume,
    paidVolume,
    todayVolume,
    liveFeedOrders,
    dineInCount,
    todayDineInCount,
    takeawayCount,
    todayTakeawayCount,
    cashCount,
    todayCashCount,
    cashCollected,
    todayCashCollected,
    onlineCount,
    todayOnlineCount,
    onlineCollected,
    todayOnlineCollected,
  } = useMemo(() => {
    const activeBranches = filteredBranches.filter((b) => b.isActive).length;
    const valid = filteredOrders.filter((o) => o.status !== 'CANCELLED');
    const todayAll = filteredOrders.filter((o) => isLocalToday(o.createdAt));
    const todayValid = valid.filter((o) => isLocalToday(o.createdAt));
    const activeStatuses = new Set<Order['status']>(['PENDING', 'CONFIRMED', 'PREPARING', 'READY']);
    const activeQueue = filteredOrders.filter((o) => activeStatuses.has(o.status));

    // Overview "Live orders" card strictly displays TODAY's orders
    const todayActiveQueue = todayAll.filter((o) => activeStatuses.has(o.status));
    const todayInactiveRecent = todayAll.filter((o) => !activeStatuses.has(o.status));
    const feed = [...todayActiveQueue, ...todayInactiveRecent].slice(0, 5);

    const sumTotal = valid.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const sumPaid = valid
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const sumToday = todayValid.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 1. Dine-In vs Takeaway Counts
    const dineInOrders = valid.filter((o) => o.orderType === 'DINE_IN');
    const todayDineInOrders = todayValid.filter((o) => o.orderType === 'DINE_IN');
    const takeawayOrders = valid.filter((o) => o.orderType === 'TAKEAWAY');
    const todayTakeawayOrders = todayValid.filter((o) => o.orderType === 'TAKEAWAY');

    // 2. Cash vs Online Collections
    const isCashOrder = (o: Order) => o.paymentMethod === 'CASH' || (o.paymentMethod as string) === 'CASH_ON_COUNTER';
    const cashOrders = valid.filter(isCashOrder);
    const todayCashOrders = todayValid.filter(isCashOrder);
    const sumCashCollected = cashOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const sumTodayCashCollected = todayCashOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const onlineOrders = valid.filter((o) => !isCashOrder(o));
    const todayOnlineOrders = todayValid.filter((o) => !isCashOrder(o));
    const sumOnlineCollected = onlineOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const sumTodayOnlineCollected = todayOnlineOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return {
      activeBranchesCount: activeBranches,
      todayOrdersCount: todayValid.length,
      totalValidOrdersCount: valid.length,
      activeQueueOrdersCount: activeQueue.length,
      todayActiveQueueCount: todayActiveQueue.length,
      totalVolume: sumTotal,
      paidVolume: sumPaid,
      todayVolume: sumToday,
      liveFeedOrders: feed,
      dineInCount: dineInOrders.length,
      todayDineInCount: todayDineInOrders.length,
      takeawayCount: takeawayOrders.length,
      todayTakeawayCount: todayTakeawayOrders.length,
      cashCount: cashOrders.length,
      todayCashCount: todayCashOrders.length,
      cashCollected: sumCashCollected,
      todayCashCollected: sumTodayCashCollected,
      onlineCount: onlineOrders.length,
      todayOnlineCount: todayOnlineOrders.length,
      onlineCollected: sumOnlineCollected,
      todayOnlineCollected: sumTodayOnlineCollected,
    };
  }, [filteredBranches, filteredOrders]);

  // Derive checklist completion strictly from real loaded data
  const hasBranch = branches.length > 0;
  const hasMenuItems = totalDishes > 0;
  const hasPaymentsConnected = restaurants.length > 0; // Cash on Counter enabled by default
  const hasFirstOrder = allOrders.length > 0;

  const checklistItems = [
    { label: 'Create a branch', isDone: hasBranch, onStart: () => setIsModalOpen(true) },
    { label: 'Add menu items & categories', isDone: hasMenuItems, onStart: () => navigate(ROUTES.MENU) },
    { label: 'Connect payments', isDone: hasPaymentsConnected, onStart: () => navigate(ROUTES.PAYMENTS) },
    {
      label: 'Receive your first dine-in order',
      isDone: hasFirstOrder,
      onStart: () => {
        if (branches[0]) {
          setQrModalBranch(branches[0]);
        } else {
          navigate(ROUTES.BRANCHES);
        }
      },
    },
  ];

  const completedSteps = checklistItems.filter((i) => i.isDone).length;
  const allStepsComplete = completedSteps === checklistItems.length;

  const renderOrderStatusPill = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            New Order
          </span>
        );
      case 'CONFIRMED':
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary-soft-text border border-primary/20">
            <ChefHat className="w-3 h-3 text-primary" />
            In Kitchen
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Bell className="w-3 h-3 text-emerald-600" />
            Ready
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-muted border border-border">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-danger/10 text-danger border border-danger/20">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <DashboardLayout
      onNewBranchClick={can('branches', 'create') ? () => setIsModalOpen(true) : undefined}
      branchCount={branches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-6">
        {/* Clean, Compact Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text tracking-tight">
              Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Manage your branches, digital QR table stands, and orders.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Prepaid Credits Balance Button */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.BILLING)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-text hover:bg-surface-2 transition-all cursor-pointer shadow-2xs"
              title="View Prepaid Credit Balance & Recharge"
            >
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-xs font-black">
                {typeof restaurants[0]?.creditBalance === 'number'
                  ? `${restaurants[0].creditBalance} Credits`
                  : 'Credits'}
              </span>
              <span className="text-[10px] text-primary font-bold hover:underline">
                Recharge &rarr;
              </span>
            </button>

            {branches.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Branch
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsQuickSetupOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> 5-Min Setup (AI) &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Restaurant Concept & Branch Outlet Selection Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface border border-border rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Restaurant Concept Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-xl px-3 py-1.5 shadow-2xs">
              <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[11px] font-bold text-muted uppercase">Concept:</span>
              <select
                aria-label="Filter by Restaurant Concept"
                value={selectedRestaurantId}
                onChange={(e) => handleRestaurantFilterChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-text focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-surface text-text">
                  All Restaurant Concepts ({restaurants.length})
                </option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id} className="bg-surface text-text">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Outlet Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-xl px-3 py-1.5 shadow-2xs">
              <Store className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-bold text-muted uppercase">Branch Outlet:</span>
              <select
                aria-label="Filter by Branch Outlet"
                value={selectedBranchId}
                onChange={(e) => handleBranchFilterChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-text focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-surface text-text">
                  All Outlets & Branches ({availableBranchesForFilter.length})
                </option>
                {availableBranchesForFilter.map((b) => (
                  <option key={b.id} value={b.id} className="bg-surface text-text">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Clear button */}
          {(selectedRestaurantId !== 'ALL' || selectedBranchId !== 'ALL') && (
            <button
              type="button"
              onClick={() => handleRestaurantFilterChange('ALL')}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer self-end sm:self-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to All Concepts</span>
            </button>
          )}
        </div>

        {/* 5-Minute Setup Action Banner */}
        {branches.length === 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-surface border border-primary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-text">Launch Storefront in 5 Minutes (AI-Powered)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    100 Free Credits Included
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Upload your paper menu photo &mdash; Smart AI extracts dishes, auto-generates descriptions, and pairs appetizing food photos!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickSetupOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Start 5-Min Setup &rarr;
            </button>
          </div>
        )}

        {/* Stats Row: 4 primary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total branches */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Total branches
            </span>
            <div className="text-[28px] font-bold text-text leading-tight my-1">
              {isBranchesLoading ? (
                <div className="h-7 w-12 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : (
                filteredBranches.length
              )}
            </div>
            <div className="text-[12px] font-medium text-success">
              {activeBranchesCount} active {activeBranchesCount === 1 ? 'location' : 'locations'}
            </div>
          </div>

          {/* Card 2: Digital Menu */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Digital Menu
            </span>
            <div className="text-[28px] font-bold text-text leading-tight my-1">
              {isMenuLoading ? (
                <div className="h-7 w-20 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : (
                `${totalDishes} ${totalDishes === 1 ? 'Dish' : 'Dishes'}`
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.MENU)}
              className="text-[12px] font-medium text-primary hover:underline cursor-pointer"
            >
              {totalCategories} {totalCategories === 1 ? 'category' : 'categories'} &bull; Manage dishes &rarr;
            </button>
          </div>

          {/* Card 3: Total Orders */}
          <div
            onClick={() => canViewOrders && navigate(ROUTES.ORDERS)}
            className={`p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none ${
              canViewOrders ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''
            }`}
          >
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Total orders
            </span>
            <div className="text-[28px] font-bold text-text leading-tight my-1">
              {isOrdersLoading && canViewOrders ? (
                <div className="h-7 w-12 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : canViewOrders ? (
                todayOrdersCount
              ) : (
                <span className="text-muted text-base font-medium">Restricted</span>
              )}
            </div>
            <div className="text-[12px] font-medium text-muted">
              {canViewOrders
                ? `today's orders • ${activeQueueOrdersCount} active in kitchen (${totalValidOrdersCount} total)`
                : 'view orders permission required'}
            </div>
          </div>

          {/* Card 4: Gross revenue */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Gross revenue
            </span>
            <div className="text-[28px] font-bold text-text leading-tight my-1">
              {isOrdersLoading && can('overview', 'viewSales') ? (
                <div className="h-7 w-20 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : can('overview', 'viewSales') ? (
                formatPrice(totalVolume)
              ) : (
                <span className="text-muted text-base font-medium">Restricted</span>
              )}
            </div>
            <div className="text-[12px] font-medium text-muted">
              {can('overview', 'viewSales')
                ? `${formatPrice(paidVolume)} paid • ${formatPrice(todayVolume)} today`
                : 'view sales permission required'}
            </div>
          </div>
        </div>

        {/* Channels & Payment Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 5: Dine-in Orders */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-medium uppercase tracking-wider">Dine-in orders</span>
              <div className="w-7 h-7 rounded-lg bg-primary-soft text-primary-soft-text flex items-center justify-center">
                <Utensils size={14} />
              </div>
            </div>
            <div className="text-[26px] font-bold text-text leading-tight my-1">
              {isOrdersLoading ? (
                <div className="h-7 w-12 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : (
                todayDineInCount
              )}
            </div>
            <div className="text-[12px] font-medium text-muted">
              in-store today &bull; {dineInCount} all-time
            </div>
          </div>

          {/* Card 6: Takeaway Orders */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-medium uppercase tracking-wider">Takeaway orders</span>
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <ShoppingBag size={14} />
              </div>
            </div>
            <div className="text-[26px] font-bold text-text leading-tight my-1">
              {isOrdersLoading ? (
                <div className="h-7 w-12 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : (
                todayTakeawayCount
              )}
            </div>
            <div className="text-[12px] font-medium text-muted">
              pickups today &bull; {takeawayCount} all-time
            </div>
          </div>

          {/* Card 7: Cash on Counter */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-medium uppercase tracking-wider">Cash on counter</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Banknote size={14} />
              </div>
            </div>
            <div className="text-[26px] font-bold text-text leading-tight my-1">
              {isOrdersLoading ? (
                <div className="h-7 w-16 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : (
                formatPrice(todayCashCollected)
              )}
            </div>
            <div className="text-[12px] font-medium text-muted">
              {todayCashCount} cash orders today &bull; {formatPrice(cashCollected)} total
            </div>
          </div>

          {/* Card 8: Online / UPI Payments */}
          <div className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-medium uppercase tracking-wider">Online & UPI payments</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Smartphone size={14} />
              </div>
            </div>
            <div className="text-[26px] font-bold text-text leading-tight my-1">
              {isOrdersLoading ? (
                <div className="h-7 w-16 bg-surface-2 rounded-[4px] animate-pulse my-1" />
              ) : (
                formatPrice(todayOnlineCollected)
              )}
            </div>
            <div className="text-[12px] font-medium text-muted">
              {todayOnlineCount} online orders today &bull; {formatPrice(onlineCollected)} total
            </div>
          </div>
        </div>

        {/* Responsive Layout: 2:1 when setup checklist is active, Full-Width once setup steps complete */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Content: Live Orders & Branches */}
          <div className={allStepsComplete ? 'lg:col-span-3 space-y-6' : 'lg:col-span-2 space-y-6'}>
            {/* 1) Live Orders Card (Today Only) */}
            <div className="p-5 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <h2 className="text-base font-semibold text-text tracking-tight">
                    Live orders
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-muted border border-border">
                    Today
                  </span>
                  {todayActiveQueueCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                      {todayActiveQueueCount} active
                    </span>
                  )}
                </div>
                {canViewOrders && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.ORDERS)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <span>Open kitchen queue</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {isOrdersLoading && canViewOrders ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-surface-2 animate-pulse" />
                  ))}
                </div>
              ) : liveFeedOrders.length > 0 && canViewOrders ? (
                <div className="space-y-2.5">
                  {liveFeedOrders.map((order) => {
                    const itemSummary = order.items
                      .slice(0, 2)
                      .map((it) => `${it.quantity}× ${it.productName}`)
                      .join(', ');
                    const extraCount = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

                    return (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-xl border border-border bg-surface-2/40 hover:bg-surface-2/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-text">
                              #{order.orderNumber}
                            </span>
                            {renderOrderStatusPill(order.status)}
                            {order.tableNumber && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-soft text-primary-soft-text">
                                Table {order.tableNumber}
                              </span>
                            )}
                            <span className="text-[11px] font-medium text-muted">
                              {order.branch?.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                            <span className="font-semibold text-text">{order.customerName}</span>
                            <span>&bull;</span>
                            <span className="truncate max-w-[260px]">
                              {itemSummary}
                              {extraCount}
                            </span>
                            <span>&bull;</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-bold text-text">
                              {formatPrice(order.totalAmount)}
                            </div>
                            <div
                              className={`text-[10px] font-semibold ${
                                order.paymentStatus === 'PAID'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {order.paymentStatus === 'PAID' ? 'Cash Paid' : 'Cash Pending'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPrintingOrder(order)}
                            className="p-1.5 rounded-lg text-text bg-surface-2 hover:bg-border transition-colors border border-border cursor-pointer"
                            title="Print Thermal Receipt"
                          >
                            <Printer size={15} className="text-primary" />
                          </button>

                          {order.status === 'PENDING' && can('orders', 'update') ? (
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={acceptingOrderId === order.id}
                              onClick={() => handleQuickAcceptOrder(order)}
                            >
                              Accept
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(ROUTES.ORDERS)}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty state: when no orders exist today */
                <div className="border border-dashed border-border rounded-[10px] p-8 text-center bg-surface-2/40">
                  <div className="w-9 h-9 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center mx-auto mb-2.5">
                    <UtensilsCrossed size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-text">
                    No orders today yet
                  </h3>
                  <p className="text-xs text-muted mt-0.5 mb-4 max-w-sm mx-auto">
                    Orders placed by diners via QR stands today will appear here in real time.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (branches[0]) {
                          setQrModalBranch(branches[0]);
                        } else {
                          navigate(ROUTES.BRANCHES);
                        }
                      }}
                    >
                      Print QR stands
                    </Button>
                    {allOrders.length > 0 && canViewOrders && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(ROUTES.ORDERS)}
                      >
                        View all orders
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2) Your Branches Section (Max 2 Rows, Full Width when checklist hidden, No QR thumbnail) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text tracking-tight">
                  Your branches {selectedRestaurantId !== 'ALL' || selectedBranchId !== 'ALL' ? `(${filteredBranches.length})` : ''}
                </h2>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.BRANCHES)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  View all {filteredBranches.length > (allStepsComplete ? 6 : 4) ? `(${filteredBranches.length})` : ''}
                </button>
              </div>

              {filteredBranches.length === 0 && !isBranchesLoading && (
                <div className="border border-dashed border-border rounded-[12px] p-8 text-center bg-surface">
                  <p className="text-sm text-muted">
                    {branches.length === 0
                      ? 'No branches created yet. Click "+ New Branch" above to create your first restaurant location.'
                      : 'No branches match the selected concept or outlet filter.'}
                  </p>
                </div>
              )}

              {filteredBranches.length > 0 && (
                <div
                  className={
                    allStepsComplete
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  }
                >
                  {filteredBranches.slice(0, allStepsComplete ? 6 : 4).map((branch) => (
                    <div
                      key={branch.id}
                      className="p-4 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none flex flex-col justify-between"
                    >
                      {/* Clean Branch Header (QR thumbnail removed) */}
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-text truncate">
                            {branch.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                branch.isActive ? 'bg-success' : 'bg-muted'
                              }`}
                            />
                            <span className={branch.isActive ? 'text-success' : 'text-muted'}>
                              {branch.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {branch.address && (
                          <p className="text-xs text-muted truncate mt-1">
                            {branch.address}
                          </p>
                        )}

                        {/* Slug link in a monospace pill with copy button */}
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-surface-2 text-muted font-mono text-[11px] mt-2.5 max-w-full">
                          <span className="truncate">/r/{branch.slug}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(branch.slug)}
                            title="Copy branch link"
                            aria-label="Copy branch link"
                            className="text-muted hover:text-text cursor-pointer shrink-0"
                          >
                            {copiedSlug === branch.slug ? (
                              <Check size={12} className="text-success" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Wired quick action buttons */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => handleGoToBranchMenu(branch)}
                        >
                          Menu
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => setQrModalBranch(branch)}
                        >
                          Print QR
                        </Button>
                        <Button
                          variant="primary-soft"
                          size="sm"
                          className="w-full"
                          onClick={() => handleGoToBranchOrders(branch)}
                        >
                          Orders
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1/3): "Get your restaurant live" checklist card */}
          {!allStepsComplete && (
            <div className="lg:col-span-1 p-5 rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)] dark:shadow-none space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text tracking-tight">
                  Get your restaurant live
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {completedSteps} of {checklistItems.length} steps complete
                </p>

                {/* 6px progress bar (primary) */}
                <div className="w-full h-[6px] bg-surface-2 rounded-full overflow-hidden my-3">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(completedSteps / checklistItems.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 4 Checklist Steps */}
              <div className="space-y-3 pt-1">
                {checklistItems.map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {step.isDone ? (
                        <CheckCircle2 size={16} className="text-success shrink-0" />
                      ) : (
                        <Circle size={16} className="text-muted shrink-0" />
                      )}
                      <span
                        className={
                          step.isDone
                            ? 'text-muted line-through truncate'
                            : 'text-text font-medium truncate'
                        }
                      >
                        {step.label}
                      </span>
                    </div>

                    {!step.isDone && (
                      <button
                        type="button"
                        onClick={step.onStart}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
                      >
                        Start
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storefront QR Studio Modal */}
      <InstagramQRModal
        branch={qrModalBranch}
        restaurant={
          qrModalBranch
            ? restaurants.find((r) => r.id === qrModalBranch.restaurantId) || null
            : null
        }
        isOpen={Boolean(qrModalBranch)}
        onClose={() => setQrModalBranch(null)}
      />

      {/* Modal Dialog for Branch Creation */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitBranch={async (data) => {
          await createBranch(data);
        }}
      />

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
        order={printingOrder}
        restaurant={
          printingOrder
            ? restaurants.find((r) => r.id === printingOrder.restaurantId) || null
            : null
        }
        branch={
          printingOrder
            ? branches.find((b) => b.id === printingOrder.branchId) || null
            : null
        }
      />
      {/* 5-Minute Quick Setup Wizard */}
      {isQuickSetupOpen && (
        <QuickSetupWizard
          onComplete={() => {
            setIsQuickSetupOpen(false);
            try {
              sessionStorage.setItem('instadine_quick_setup_dismissed', '1');
            } catch {}
            queryClient.invalidateQueries();
          }}
          onCancel={() => {
            setIsQuickSetupOpen(false);
            try {
              sessionStorage.setItem('instadine_quick_setup_dismissed', '1');
            } catch {}
          }}
        />
      )}
    </DashboardLayout>
  );
};
