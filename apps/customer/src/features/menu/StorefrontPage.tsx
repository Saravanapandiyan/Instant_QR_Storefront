import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Banknote,
  User,
  Phone,
  Receipt,
  Bell,
  ChefHat,
  ChevronRight,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { fetchStorefrontBySlug } from '../../api/storefrontApi.ts';
import { placeCashOrder } from '../../api/ordersApi.ts';
import { useStorefrontTheme } from '../../store/useStorefrontTheme.ts';
import { useCartStore } from '../../store/useCartStore.ts';
import { DishDetailModal } from './DishDetailModal.tsx';
import { OrderTrackingModal } from '../order/OrderTrackingModal.tsx';
import { MyOrdersModal } from '../order/MyOrdersModal.tsx';
import { useCustomerOrders } from '../order/useCustomerOrders.ts';
import type { StorefrontMenuData, StorefrontItem } from '../../types/storefront.ts';

function getAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.replace(/^\/?(uploads\/)?/, '');
  return `/uploads/${clean}`;
}

export function StorefrontPage() {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWAInstall();

  const [menuData, setMenuData] = useState<StorefrontMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile cart drawer open/close
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Dish Details & Customization Modal
  const [selectedDishForModal, setSelectedDishForModal] = useState<StorefrontItem | null>(null);

  // Cart store
  const {
    items: cartItems,
    addItem,
    addItemWithDetails,
    updateQuantity,
    getItemQuantity,
    getItemNotes,
    getTotalItemsCount,
    getSubtotal,
    clearCart,
  } = useCartStore();

  // Checkout order form state
  const [searchParams] = useSearchParams();
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>(
    searchParams.get('table') || searchParams.get('t') || '',
  );
  const [customerName, setCustomerName] = useState<string>(
    () => localStorage.getItem('iqr_customer_name') || '',
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    () => localStorage.getItem('iqr_customer_phone') || '',
  );
  const [cookingInstructions, setCookingInstructions] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState<boolean>(false);

  // Customer order session store
  const {
    orders: customerOrders,
    activeOrder,
    savePlacedOrder,
    updateOrderStatus,
  } = useCustomerOrders(branchSlug);

  // Load menu data
  useEffect(() => {
    if (!branchSlug) return;
    setLoading(true);
    setError(null);

    fetchStorefrontBySlug(branchSlug)
      .then((data) => {
        setMenuData(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Unable to load menu.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [branchSlug]);

  // Dynamic Theme
  const { isDarkMode, toggleDarkMode } = useStorefrontTheme(menuData?.restaurant?.themeConfig);

  // Format currency
  const currencySymbol = useMemo(() => {
    const code = menuData?.branch?.currency || 'INR';
    if (code === 'INR') return '₹';
    if (code === 'USD') return '$';
    if (code === 'EUR') return '€';
    if (code === 'GBP') return '£';
    return code + ' ';
  }, [menuData]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!menuData) return [];
    return menuData.items.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [menuData, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    if (!menuData) return {};
    const counts: Record<string, number> = { all: menuData.items.length };
    menuData.items.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    });
    return counts;
  }, [menuData]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'var(--sf-bg)', color: 'var(--sf-text)' }}
      >
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
        <p className="text-xs font-medium opacity-80">Loading digital menu...</p>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: 'var(--sf-bg)', color: 'var(--sf-text)' }}
      >
        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold mb-1">Branch Storefront Not Found</h2>
        <p className="text-[11px] opacity-75 max-w-sm mb-4">{error || 'Please check the QR link and try again.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm"
          style={{ backgroundColor: 'var(--sf-primary)' }}
        >
          Return to Scanner
        </button>
      </div>
    );
  }

  const { branch, restaurant, categories } = menuData;
  const subtotal = getSubtotal();

  // Taxes are only applied if explicitly configured by the restaurant in payment settings
  const paymentConfig = (restaurant as any)?.paymentConfig || {};
  const enableTax = Boolean(paymentConfig.enableTax);
  const taxRate =
    enableTax && typeof paymentConfig.taxRate === 'number' && paymentConfig.taxRate > 0
      ? paymentConfig.taxRate
      : 0;
  const tax = taxRate > 0 ? Number(((subtotal * taxRate) / 100).toFixed(2)) : 0;
  const grandTotal = subtotal > 0 ? (subtotal + tax).toFixed(2) : '0.00';
  const totalItemCount = getTotalItemsCount();

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'Main Dish'
      : categories.find((c) => c.id === selectedCategory)?.name || 'Dishes';

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{ backgroundColor: 'var(--sf-bg)', color: 'var(--sf-text)' }}
    >
      {/* =========================================================================
          TOP NAVBAR: Slim, reduced text sizes
         ========================================================================= */}
      <header
        className="hidden md:flex items-center justify-between px-4 lg:px-6 py-2.5 border-b sticky top-0 z-30 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--sf-surface)',
          borderColor: 'var(--sf-border)',
        }}
      >
        {/* Left: Brand Avatar + Name + Location */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shadow-sm shrink-0 overflow-hidden"
            style={{
              backgroundColor: 'var(--sf-primary)',
              color: 'var(--sf-primary-contrast)',
            }}
          >
            {restaurant.logoUrl ? (
              <img
                src={getAssetUrl(restaurant.logoUrl)!}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              restaurant.name ? restaurant.name.charAt(0).toUpperCase() : 'R'
            )}
          </div>

          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight leading-tight" style={{ color: 'var(--sf-text)' }}>
              {restaurant.name}
            </h1>
            {branch.address && (
              <p className="text-[10px] sm:text-[11px] mt-0.5 leading-none" style={{ color: 'var(--sf-muted)' }}>
                {branch.address}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search Input + Mode Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-56 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes"
              className="w-full pl-7.5 pr-2.5 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-orange-500"
              style={{
                backgroundColor: 'var(--sf-bg)',
                borderColor: 'var(--sf-border)',
                color: 'var(--sf-text)',
              }}
            />
          </div>

          {/* My Orders Button */}
          <button
            onClick={() => setIsMyOrdersOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all relative cursor-pointer"
            style={{
              backgroundColor: activeOrder ? 'var(--sf-primary)' : 'var(--sf-surface)',
              borderColor: activeOrder ? 'var(--sf-primary)' : 'var(--sf-border)',
              color: activeOrder ? 'var(--sf-primary-contrast, #ffffff)' : 'var(--sf-text)',
            }}
            title="View my placed orders"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>My Orders</span>
            {customerOrders.length > 0 && (
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
                style={{
                  backgroundColor: activeOrder
                    ? 'rgba(255,255,255,0.25)'
                    : 'var(--sf-surface-2, rgba(0,0,0,0.08))',
                  color: activeOrder ? '#ffffff' : 'var(--sf-text)',
                }}
              >
                {customerOrders.length}
              </span>
            )}
            {activeOrder && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* PWA Install Button when prompt is available */}
          {isInstallable && (
            <button
              onClick={installApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'var(--sf-surface)',
                borderColor: 'var(--sf-border)',
                color: 'var(--sf-text)',
              }}
              title="Install Storefront as PWA on your device"
            >
              <Download className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOP HEADER (< 768px)
         ========================================================================= */}
      <div className="md:hidden px-4 pt-3 pb-2">
        {/* Brand Row */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm shrink-0 overflow-hidden"
              style={{
                backgroundColor: 'var(--sf-primary)',
                color: 'var(--sf-primary-contrast)',
              }}
            >
              {restaurant.logoUrl ? (
                <img
                  src={getAssetUrl(restaurant.logoUrl)!}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                restaurant.name ? restaurant.name.charAt(0).toUpperCase() : 'R'
              )}
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-tight leading-tight" style={{ color: 'var(--sf-text)' }}>
                {restaurant.name}
              </h1>
              {branch.address && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--sf-muted)' }}>
                  {branch.address}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMyOrdersOpen(true)}
              className="p-1.5 rounded-lg border relative flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: activeOrder ? 'var(--sf-primary)' : 'var(--sf-surface)',
                borderColor: activeOrder ? 'var(--sf-primary)' : 'var(--sf-border)',
                color: activeOrder ? 'var(--sf-primary-contrast, #ffffff)' : 'var(--sf-text)',
              }}
              title="My Orders"
            >
              <Receipt className="w-4 h-4" />
              {customerOrders.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs"
                  style={{
                    backgroundColor: activeOrder ? '#10b981' : 'var(--sf-primary)',
                    color: '#ffffff',
                  }}
                >
                  {customerOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg opacity-70"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-orange-500"
            style={{
              backgroundColor: 'var(--sf-surface)',
              borderColor: 'var(--sf-border)',
              color: 'var(--sf-text)',
            }}
          />
        </div>

        {/* Horizontal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
            style={
              selectedCategory === 'all'
                ? {
                    backgroundColor: 'var(--sf-primary)',
                    color: 'var(--sf-primary-contrast)',
                    borderColor: 'transparent',
                  }
                : {
                    backgroundColor: 'var(--sf-surface)',
                    borderColor: 'var(--sf-border)',
                    color: 'var(--sf-text)',
                  }
            }
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
              style={
                selectedCategory === cat.id
                  ? {
                      backgroundColor: 'var(--sf-primary)',
                      color: 'var(--sf-primary-contrast)',
                      borderColor: 'transparent',
                    }
                  : {
                      backgroundColor: 'var(--sf-surface)',
                      borderColor: 'var(--sf-border)',
                      color: 'var(--sf-text)',
                    }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mt-1 mb-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--sf-text)' }}>
            {activeCategoryName}
          </h2>
          <span className="text-[11px]" style={{ color: 'var(--sf-muted)' }}>
            {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          EXACT 15% / 60% / 25% SPLIT SCREEN (From 768px to 2560px)
          - 15% -> Category Sidebar (Left)
          - 60% -> Cards Grid (Center)
          - 25% -> Order Review Card (Right)
         ========================================================================= */}
      <div
        className="flex-1 w-full px-3 lg:px-6 py-4 flex flex-col md:grid gap-3 lg:gap-4"
        style={{
          gridTemplateColumns: 'minmax(0, 15fr) minmax(0, 60fr) minmax(0, 25fr)',
        }}
      >
        {/* ---------------------------------------------------------------------
            COLUMN 1 (15%): CATEGORY SIDEBAR
           --------------------------------------------------------------------- */}
        <aside className="hidden md:block w-full min-w-0">
          <div className="space-y-1 sticky top-16">
            <button
              onClick={() => setSelectedCategory('all')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                selectedCategory === 'all'
                  ? {
                      backgroundColor: 'var(--sf-surface)',
                      borderLeft: '3px solid var(--sf-primary)',
                      color: 'var(--sf-primary)',
                      fontWeight: 700,
                    }
                  : {
                      color: 'var(--sf-muted)',
                    }
              }
            >
              <span className="truncate">All</span>
              <span className="text-[10px] opacity-75 ml-1">{categoryCounts['all'] || 0}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  selectedCategory === cat.id
                    ? {
                        backgroundColor: 'var(--sf-surface)',
                        borderLeft: '3px solid var(--sf-primary)',
                        color: 'var(--sf-primary)',
                        fontWeight: 700,
                      }
                    : {
                        color: 'var(--sf-muted)',
                      }
                }
              >
                <span className="truncate">{cat.name}</span>
                <span className="text-[10px] opacity-75 ml-1">{categoryCounts[cat.id] || 0}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ---------------------------------------------------------------------
            COLUMN 2 (60%): DISH CARDS
           --------------------------------------------------------------------- */}
        <main className="w-full min-w-0">
          {/* Section Header */}
          <div className="hidden md:flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: 'var(--sf-text)' }}>
              {activeCategoryName}
            </h2>
            <span className="text-[11px]" style={{ color: 'var(--sf-muted)' }}>
              {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
            </span>
          </div>

          {/* -------------------------------------------------------------
              MOBILE DISH CARDS (< 768px)
             ------------------------------------------------------------- */}
          <div className="md:hidden space-y-2.5 pb-24">
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item.id);
              const isSoldOut = !item.isAvailable;
              const price = Number(item.finalPrice || item.basePrice || 0);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDishForModal(item)}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-2.5 shadow-xs transition-all cursor-pointer hover:border-[var(--sf-primary)]/50 active:scale-[0.99] ${
                    isSoldOut ? 'opacity-70' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--sf-surface)',
                    borderColor: 'var(--sf-border)',
                  }}
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className={`w-3 h-3 border rounded-xs flex items-center justify-center shrink-0 ${
                          item.isVeg !== false ? 'border-emerald-600' : 'border-red-600'
                        }`}
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${
                            item.isVeg !== false ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                      </div>

                      {item.isBestseller && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900">
                          BESTSELLER
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm tracking-tight leading-snug truncate" style={{ color: 'var(--sf-text)' }}>
                      {item.name}
                    </h3>

                    {item.description && (
                      <p className="text-[10px] sm:text-[11px] line-clamp-1 mt-0.5 leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
                        {item.description}
                      </p>
                    )}

                    <p className="font-bold text-xs sm:text-sm mt-1.5" style={{ color: 'var(--sf-text)' }}>
                      {currencySymbol}
                      {price}
                    </p>
                  </div>

                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-inner bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center">
                    {item.imageUrl && (
                      <img
                        src={getAssetUrl(item.imageUrl)!}
                        alt={item.name}
                        className="relative z-10 w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}

                    {isSoldOut ? (
                      <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded bg-zinc-900/90">
                          SOLD OUT
                        </span>
                      </div>
                    ) : (
                      <div
                        className="absolute bottom-1 inset-x-1.5 z-20 flex justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {qty === 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(item);
                            }}
                            className="w-full py-0.5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm active:scale-95 transition-transform text-center border"
                            style={{
                              backgroundColor: 'var(--sf-surface)',
                              color: 'var(--sf-primary)',
                              borderColor: 'var(--sf-border)',
                            }}
                          >
                            ADD
                          </button>
                        ) : (
                          <div
                            className="w-full py-0.5 rounded-md text-[10px] font-bold flex items-center justify-between shadow-sm"
                            style={{
                              backgroundColor: 'var(--sf-primary)',
                              color: 'var(--sf-primary-contrast)',
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, -1);
                              }}
                              className="px-1.5 py-0.5 hover:bg-black/10"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[10px]">{qty}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, 1);
                              }}
                              className="px-1.5 py-0.5 hover:bg-black/10"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* -------------------------------------------------------------
              60% DESKTOP & TABLET DISH GRID (768px to 2560px)
              - 768px - 1280px: 2 wide columns
              - 1280px - 1536px: 3 wide columns
              - 1536px+: 4 wide columns
             ------------------------------------------------------------- */}
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 lg:gap-4 pb-8">
            {filteredItems.map((item) => {
              const qty = getItemQuantity(item.id);
              const isSoldOut = !item.isAvailable;
              const price = Number(item.finalPrice || item.basePrice || 0);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDishForModal(item)}
                  className={`rounded-xl border overflow-hidden flex flex-col justify-between shadow-xs transition-all cursor-pointer hover:border-[var(--sf-primary)]/50 hover:shadow-md active:scale-[0.99] ${
                    isSoldOut ? 'opacity-70' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--sf-surface)',
                    borderColor: 'var(--sf-border)',
                  }}
                >
                  {/* Compact Top Image Banner: Reduced height */}
                  <div className="relative aspect-[16/10] w-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-white/60 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white/80" />
                        </div>
                      </div>
                    </div>

                    {item.imageUrl && (
                      <img
                        src={getAssetUrl(item.imageUrl)!}
                        alt={item.name}
                        className="relative z-10 w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}

                    {/* Veg indicator badge */}
                    <div className="absolute top-2 left-2 bg-white/95 rounded-xs p-0.5 shadow-xs z-20">
                      <div
                        className={`w-3 h-3 border flex items-center justify-center ${
                          item.isVeg !== false ? 'border-emerald-600' : 'border-red-600'
                        }`}
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${
                            item.isVeg !== false ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                      </div>
                    </div>

                    {isSoldOut && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide bg-zinc-900/90 text-white shadow-xs z-20">
                        SOLD OUT
                      </span>
                    )}
                  </div>

                  {/* Card Body: Reduced text sizes */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <h3 className="font-bold text-xs sm:text-sm tracking-tight leading-snug truncate" style={{ color: 'var(--sf-text)' }}>
                          {item.name}
                        </h3>
                        <span className="font-bold text-xs sm:text-sm whitespace-nowrap" style={{ color: 'var(--sf-text)' }}>
                          {currencySymbol}
                          {price}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[10px] sm:text-[11px] line-clamp-1 leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-2 pt-1.5 flex items-center justify-between border-t" style={{ borderColor: 'var(--sf-border)' }}>
                      <div>
                        {item.isBestseller && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-orange-100 text-orange-800">
                            BESTSELLER
                          </span>
                        )}
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        {isSoldOut ? (
                          <span className="text-[10px] font-medium" style={{ color: 'var(--sf-muted)' }}>Unavailable</span>
                        ) : qty === 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(item);
                            }}
                            className="px-3 py-0.5 rounded-md text-[11px] font-bold uppercase border active:scale-95 transition-transform cursor-pointer"
                            style={{
                              borderColor: 'var(--sf-primary)',
                              color: 'var(--sf-primary)',
                              backgroundColor: 'transparent',
                            }}
                          >
                            ADD
                          </button>
                        ) : (
                          <div
                            className="inline-flex items-center rounded-md overflow-hidden text-xs font-bold shadow-xs"
                            style={{
                              backgroundColor: 'var(--sf-primary)',
                              color: 'var(--sf-primary-contrast)',
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, -1);
                              }}
                              className="px-1.5 py-0.5 hover:bg-black/10 cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="px-1.5 text-[11px]">{qty}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, 1);
                              }}
                              className="px-1.5 py-0.5 hover:bg-black/10 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ---------------------------------------------------------------------
            COLUMN 3 (25%): ORDER REVIEW CARD
           --------------------------------------------------------------------- */}
        <aside className="hidden md:block w-full min-w-0">
          <div
            className="rounded-xl border p-3.5 sticky top-16 shadow-xs flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--sf-surface)',
              borderColor: 'var(--sf-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b mb-2.5" style={{ borderColor: 'var(--sf-border)' }}>
                <h2 className="font-bold text-xs sm:text-sm tracking-tight" style={{ color: 'var(--sf-text)' }}>
                  Your order
                </h2>
                <span className="text-[10px] opacity-75" style={{ color: 'var(--sf-muted)' }}>
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-6 text-center" style={{ color: 'var(--sf-muted)' }}>
                  <ShoppingBag className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs font-medium">Your cart is empty</p>
                  <p className="text-[10px] mt-0.5 opacity-75">Select dishes to start your order</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {cartItems.map(({ item, quantity, notes }) => {
                    const price = Number(item.finalPrice || item.basePrice || 0);
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-1.5 text-xs">
                        <div
                          className="flex-1 min-w-0 cursor-pointer group"
                          onClick={() => setSelectedDishForModal(item)}
                        >
                          <p className="font-bold text-xs truncate group-hover:underline" style={{ color: 'var(--sf-text)' }}>
                            {item.name}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                            {currencySymbol}
                            {price} each
                          </p>
                          {notes && (
                            <p className="text-[10px] italic mt-0.5 line-clamp-2 px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--sf-bg)', borderColor: 'var(--sf-border)', color: 'var(--sf-muted)' }}>
                              Note: {notes}
                            </p>
                          )}
                        </div>

                        {/* Stepper */}
                        <div
                          className="inline-flex items-center rounded-md overflow-hidden text-xs font-bold"
                          style={{
                            backgroundColor: 'var(--sf-primary)',
                            color: 'var(--sf-primary-contrast)',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-1 py-0.5 hover:bg-black/10"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-1 text-[11px]">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-1 py-0.5 hover:bg-black/10"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <span className="font-bold min-w-[40px] text-right text-xs" style={{ color: 'var(--sf-text)' }}>
                          {currencySymbol}
                          {price * quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bill Summary & Place Order Button */}
            {cartItems.length > 0 && (
              <div className="pt-2.5 border-t mt-2.5 space-y-1" style={{ borderColor: 'var(--sf-border)' }}>
                <div className="flex justify-between text-[11px]" style={{ color: 'var(--sf-muted)' }}>
                  <span>Subtotal</span>
                  <span className="font-medium" style={{ color: 'var(--sf-text)' }}>
                    {currencySymbol}
                    {subtotal}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-[11px]" style={{ color: 'var(--sf-muted)' }}>
                    <span>GST / Taxes ({taxRate}%)</span>
                    <span className="font-medium" style={{ color: 'var(--sf-text)' }}>
                      {currencySymbol}
                      {tax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold pt-1 border-t" style={{ borderColor: 'var(--sf-border)', color: 'var(--sf-text)' }}>
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {grandTotal}
                  </span>
                </div>

                <button
                  onClick={() => setIsMobileCartOpen(true)}
                  className="w-full mt-2 py-1.5 rounded-lg font-bold text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--sf-primary)',
                    color: 'var(--sf-primary-contrast)',
                  }}
                >
                  <span>Place order</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* =========================================================================
          MOBILE STICKY BOTTOM CART BAR (< 768px)
         ========================================================================= */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-3 inset-x-3 z-40 animate-fade-in">
          <div
            onClick={() => setIsMobileCartOpen(true)}
            className="rounded-xl p-3 shadow-xl flex items-center justify-between cursor-pointer"
            style={{
              backgroundColor: 'var(--sf-primary)',
              color: 'var(--sf-primary-contrast)',
            }}
          >
            <div className="font-bold text-xs">
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} • {currencySymbol}
              {subtotal}
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span>View cart</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ORDER CHECKOUT DRAWER / MODAL (Mobile + Desktop)
         ========================================================================= */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div
            className="rounded-t-3xl sm:rounded-3xl max-h-[92vh] w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6 flex flex-col shadow-2xl"
            style={{
              backgroundColor: 'var(--sf-surface)',
              color: 'var(--sf-text)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-3 border-b mb-3"
              style={{ borderColor: 'var(--sf-border)' }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1 -ml-1 opacity-70 hover:opacity-100 rounded-lg hover:bg-black/5"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-bold leading-none" style={{ color: 'var(--sf-text)' }}>
                    Checkout Order
                  </h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--sf-muted)' }}>
                    {branch.name} {branch.address ? `• ${branch.address}` : ''}
                  </p>
                </div>
              </div>

              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: 'var(--sf-primary)',
                  color: 'var(--sf-primary-contrast)',
                }}
              >
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Error Banner */}
            {checkoutError && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* 1. DISHES ORDERED (Fully visible, not clipped) */}
            <div className="mb-3 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold" style={{ color: 'var(--sf-text)' }}>
                  Your Dishes ({totalItemCount})
                </label>
                <span className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                  Tap dish to customize
                </span>
              </div>
              <div
                className="border rounded-2xl p-2.5 space-y-2 max-h-56 overflow-y-auto"
                style={{
                  backgroundColor: 'var(--sf-bg)',
                  borderColor: 'var(--sf-border)',
                }}
              >
                {cartItems.map(({ item, quantity, notes }) => {
                  const price = Number(item.finalPrice || item.basePrice || 0);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2.5 py-1.5 border-b last:border-b-0 text-xs"
                      style={{ borderColor: 'var(--sf-border)' }}
                    >
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          setIsMobileCartOpen(false);
                          setSelectedDishForModal(item);
                        }}
                      >
                        <div
                          className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center shrink-0 ${
                            item.isVeg !== false ? 'border-emerald-600' : 'border-red-600'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg !== false ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs leading-snug truncate" style={{ color: 'var(--sf-text)' }}>
                            {item.name}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                            {currencySymbol}{price} each
                          </p>
                          {notes && (
                            <p className="text-[10px] italic text-amber-600 dark:text-amber-400 truncate">
                              Note: {notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: 'var(--sf-primary)',
                          color: 'var(--sf-primary-contrast)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 hover:bg-black/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 text-xs">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 hover:bg-black/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span
                        className="font-bold min-w-[48px] text-right text-xs shrink-0"
                        style={{ color: 'var(--sf-text)' }}
                      >
                        {currencySymbol}{price * quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Dining Preference Toggle: Dine-in vs Takeaway */}
            <div className="mb-3 shrink-0">
              <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--sf-text)' }}>
                Dining Preference
              </label>
              <div
                className="grid grid-cols-2 p-1 rounded-xl border text-xs font-bold"
                style={{
                  backgroundColor: 'var(--sf-bg)',
                  borderColor: 'var(--sf-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
                    orderType === 'DINE_IN'
                      ? 'shadow-xs font-bold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={
                    orderType === 'DINE_IN'
                      ? {
                          backgroundColor: 'var(--sf-primary)',
                          color: 'var(--sf-primary-contrast)',
                        }
                      : {}
                  }
                >
                  🍽️ Dine-in
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
                    orderType === 'TAKEAWAY'
                      ? 'shadow-xs font-bold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={
                    orderType === 'TAKEAWAY'
                      ? {
                          backgroundColor: 'var(--sf-primary)',
                          color: 'var(--sf-primary-contrast)',
                        }
                      : {}
                  }
                >
                  🥡 Takeaway / Pickup
                </button>
              </div>
            </div>

            {/* 3. Customer Details & Table inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 shrink-0">
              {orderType === 'DINE_IN' && (
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--sf-text)' }}>
                    Table Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Table 4, T-12..."
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500"
                    style={{
                      backgroundColor: 'var(--sf-bg)',
                      borderColor: 'var(--sf-border)',
                      color: 'var(--sf-text)',
                    }}
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--sf-text)' }}>
                  Your Name <span className="text-[10px] opacity-60 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50" />
                  <input
                    type="text"
                    placeholder="e.g. Diner"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2 pl-8 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500"
                    style={{
                      backgroundColor: 'var(--sf-bg)',
                      borderColor: 'var(--sf-border)',
                      color: 'var(--sf-text)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--sf-text)' }}>
                  Phone Number <span className="text-[10px] opacity-60 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2 pl-8 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500"
                    style={{
                      backgroundColor: 'var(--sf-bg)',
                      borderColor: 'var(--sf-border)',
                      color: 'var(--sf-text)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Cooking Instructions */}
            <div className="mb-3 shrink-0">
              <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--sf-text)' }}>
                Cooking instructions / Special requests
              </label>
              <textarea
                rows={1}
                placeholder="Less spicy, no onion, extra chutney..."
                value={cookingInstructions}
                onChange={(e) => setCookingInstructions(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500"
                style={{
                  backgroundColor: 'var(--sf-bg)',
                  borderColor: 'var(--sf-border)',
                  color: 'var(--sf-text)',
                }}
              />
            </div>

            {/* 5. Payment Method (Cash on Counter only - Online completely hidden) */}
            <div className="mb-3 shrink-0">
              <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--sf-text)' }}>
                Payment Method
              </label>
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--sf-bg)',
                  borderColor: 'var(--sf-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold" style={{ color: 'var(--sf-text)' }}>
                    Cash on Counter
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    Default
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                  Pay at cashier counter
                </span>
              </div>
            </div>

            {/* Bill Summary */}
            <div
              className="border-t pt-2.5 mb-3 space-y-1 text-[11px]"
              style={{ borderColor: 'var(--sf-border)', color: 'var(--sf-muted)' }}
            >
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span style={{ color: 'var(--sf-text)' }}>
                  {currencySymbol}
                  {subtotal}
                </span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>GST / Taxes ({taxRate}%)</span>
                  <span style={{ color: 'var(--sf-text)' }}>
                    {currencySymbol}
                    {tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-xs font-bold pt-1 border-t"
                style={{ borderColor: 'var(--sf-border)', color: 'var(--sf-text)' }}
              >
                <span>Total Due</span>
                <span>
                  {currencySymbol}
                  {grandTotal}
                </span>
              </div>
            </div>

            {/* Place Cash Order Button */}
            <button
              onClick={async () => {
                if (cartItems.length === 0) return;

                if (!customerName.trim()) {
                  setCheckoutError('Please enter your name.');
                  return;
                }

                if (!customerPhone.trim() || customerPhone.trim().length < 7) {
                  setCheckoutError('Please enter a valid phone number.');
                  return;
                }

                if (orderType === 'DINE_IN' && !tableNumber.trim()) {
                  setCheckoutError('Please enter your table number.');
                  return;
                }

                setIsPlacingOrder(true);
                setCheckoutError(null);

                try {
                  const res = await placeCashOrder({
                    branchSlug: branch.slug,
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim(),
                    tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() : null,
                    orderType,
                    orderNotes: cookingInstructions.trim() || undefined,
                    paymentMethod: 'CASH',
                    items: cartItems.map((ci) => ({
                      productId: ci.item.id,
                      quantity: ci.quantity,
                      notes: ci.notes,
                    })),
                  });

                  // Persist customer profile for seamless PWA experience
                  try {
                    localStorage.setItem('iqr_customer_name', customerName.trim());
                    localStorage.setItem('iqr_customer_phone', customerPhone.trim());
                  } catch {}

                  savePlacedOrder(res.order);
                  clearCart();
                  setIsMobileCartOpen(false);
                  setPlacedOrderId(res.order.id);
                } catch (err: any) {
                  setCheckoutError(err.message || 'Failed to place order.');
                } finally {
                  setIsPlacingOrder(false);
                }
              }}
              disabled={isPlacingOrder || cartItems.length === 0}
              className="w-full py-3 rounded-2xl font-bold text-xs shadow-lg active:scale-[0.99] transition-transform text-center cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--sf-primary)',
                color: 'var(--sf-primary-contrast)',
              }}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing order...</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>
                    Pay Cash on Counter • {currencySymbol}
                    {grandTotal}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PERSISTENT ACTIVE ORDER STATUS BAR (PWA Dynamic Tracker)
         ========================================================================= */}
      {activeOrder && !placedOrderId && !isMobileCartOpen && !isMyOrdersOpen && (
        <div
          className={`fixed inset-x-3 md:inset-x-auto md:right-6 md:w-96 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            cartItems.length > 0 ? 'bottom-16 md:bottom-5' : 'bottom-3 md:bottom-5'
          }`}
        >
          <div
            onClick={() => setPlacedOrderId(activeOrder.id)}
            className="p-3 rounded-2xl shadow-2xl border flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all backdrop-blur-md ring-1 ring-black/5 hover:shadow-xl"
            style={{
              backgroundColor: 'var(--sf-surface)',
              borderColor: 'var(--sf-primary)',
              color: 'var(--sf-text)',
            }}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                style={{ backgroundColor: 'var(--sf-primary)' }}
              >
                {activeOrder.status === 'READY' ? (
                  <Bell className="w-5 h-5 animate-bounce" />
                ) : (
                  <ChefHat className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight">
                    Order #{activeOrder.orderNumber}
                  </span>
                  <span
                    className="px-2 py-0.2 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor:
                        activeOrder.status === 'READY'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(249, 115, 22, 0.15)',
                      color: activeOrder.status === 'READY' ? '#10b981' : '#f97316',
                    }}
                  >
                    {activeOrder.status === 'READY'
                      ? 'Ready to Serve!'
                      : activeOrder.status === 'PREPARING'
                      ? 'Kitchen Preparing'
                      : 'Order Received'}
                  </span>
                </div>
                <p className="text-[11px] opacity-75 truncate mt-0.5">
                  {activeOrder.itemCount} {activeOrder.itemCount === 1 ? 'dish' : 'dishes'} • {currencySymbol}
                  {activeOrder.totalAmount.toFixed(2)} • Tap to view status
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-1 text-xs font-black shrink-0 pl-2"
              style={{ color: 'var(--sf-primary)' }}
            >
              <span>Live Track</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracking Modal */}
      {placedOrderId && (
        <OrderTrackingModal
          orderId={placedOrderId}
          currencySymbol={currencySymbol}
          onClose={() => setPlacedOrderId(null)}
          onOrderAgain={() => setPlacedOrderId(null)}
          onStatusUpdate={(order) => {
            updateOrderStatus(order.id, order.status, order.paymentStatus);
          }}
        />
      )}

      {/* Customer Session Orders History Modal */}
      {isMyOrdersOpen && (
        <MyOrdersModal
          orders={customerOrders}
          currencySymbol={currencySymbol}
          onClose={() => setIsMyOrdersOpen(false)}
          onSelectOrder={(orderId) => {
            setIsMyOrdersOpen(false);
            setPlacedOrderId(orderId);
          }}
        />
      )}

      {/* Dish Detail & Customization Modal */}
      <DishDetailModal
        item={selectedDishForModal}
        currencySymbol={currencySymbol}
        initialQuantity={selectedDishForModal ? getItemQuantity(selectedDishForModal.id) : 1}
        initialNotes={selectedDishForModal ? getItemNotes(selectedDishForModal.id) : ''}
        onClose={() => setSelectedDishForModal(null)}
        onConfirm={(item, quantity, notes) => {
          addItemWithDetails(item, quantity, notes);
        }}
      />
    </div>
  );
}
