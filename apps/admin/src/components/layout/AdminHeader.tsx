import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  MapPin,
  Globe,
  Coins,
} from 'lucide-react';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { adminRestaurantsApi } from '../../api/adminRestaurantsApi.ts';
import { CURRENCIES, type SupportedCurrency } from '../../utils/currencyConverter.ts';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Executive Overview',
  '/restaurants': 'Restaurants & Fleet',
  '/branches': 'Outlets & Branches',
  '/dishes': 'Menu & Dish Catalog',
  '/users': 'User Accounts',
  '/plans': 'Subscription & Plans',
  '/settings/site': 'Site Branding & Footer',
  '/settings/pay': 'Stripe & Gateway',
  '/orders': 'Live Orders Stream',
};

export function AdminHeader() {
  const location = useLocation();

  const {
    selectedRestaurantId,
    selectedBranchId,
    selectedCurrency,
    setSelectedRestaurantId,
    setSelectedBranchId,
    setSelectedCurrency,
  } = useAdminScopeStore();

  // Load restaurants for global header scope dropdown
  const { data: restaurantsData } = useQuery({
    queryKey: ['admin-header-restaurants'],
    queryFn: () => adminRestaurantsApi.getRestaurants(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const restaurants = restaurantsData?.restaurants || [];

  // Determine currently selected restaurant object and its branches
  const selectedRestaurant =
    selectedRestaurantId !== 'ALL'
      ? restaurants.find((r) => r.id === selectedRestaurantId)
      : null;

  const availableBranches = selectedRestaurant?.branches || [];

  const title = ROUTE_TITLES[location.pathname] || 'Control Plane';

  return (
    <header
      className="fixed top-0 left-64 right-0 h-14 z-40 px-6 flex items-center justify-between border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--adm-surface)',
        borderColor: 'var(--adm-border)',
        color: 'var(--adm-text)',
      }}
    >
      {/* Left: Breadcrumb / Page Title */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-neutral-400">Admin</span>
        <span className="text-xs text-neutral-400">/</span>
        <h2 className="font-bold text-sm tracking-tight" style={{ color: 'var(--adm-text)' }}>
          {title}
        </h2>
      </div>

      {/* Center: Global Persistent Restaurant & Branch Scope Selector (Fixed Width, No Stretch) */}
      <div className="flex items-center gap-2 mx-4">
        {/* Restaurant Selector Dropdown */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs shadow-xs transition-colors w-48 sm:w-56"
          style={{
            backgroundColor: 'var(--adm-surface-subtle)',
            borderColor: selectedRestaurantId !== 'ALL' ? 'var(--adm-primary)' : 'var(--adm-border)',
          }}
        >
          {selectedRestaurantId !== 'ALL' ? (
            <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 opacity-70 shrink-0" />
          )}
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer flex-1 min-w-0 truncate pr-1"
            style={{ color: 'var(--adm-text)' }}
            title="Filter all platform data by restaurant brand"
          >
            <option value="ALL" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>
              All Restaurants (Global Fleet)
            </option>
            {restaurants.map((r) => (
              <option
                key={r.id}
                value={r.id}
                style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
              >
                {r.name} {r.status === 'SUSPENDED' ? '(Suspended)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Selector Dropdown */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs shadow-xs transition-colors w-48 sm:w-56"
          style={{
            backgroundColor: 'var(--adm-surface-subtle)',
            borderColor: selectedBranchId !== 'ALL' ? 'var(--adm-primary)' : 'var(--adm-border)',
            opacity: selectedRestaurantId === 'ALL' ? 0.6 : 1,
          }}
        >
          <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0 text-emerald-500" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            disabled={selectedRestaurantId === 'ALL'}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer flex-1 min-w-0 truncate pr-1 disabled:cursor-not-allowed"
            style={{ color: 'var(--adm-text)' }}
            title={
              selectedRestaurantId === 'ALL'
                ? 'Select a specific restaurant first to filter by branch outlet'
                : 'Filter data by branch outlet'
            }
          >
            <option value="ALL" style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}>
              All Outlets ({availableBranches.length})
            </option>
            {availableBranches.map((b) => (
              <option
                key={b.id}
                value={b.id}
                style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
              >
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Global Display Currency Only */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs shadow-xs transition-colors"
          style={{
            backgroundColor: 'var(--adm-surface-subtle)',
            borderColor: 'var(--adm-border)',
          }}
          title="Display currency across revenue metrics and analytics"
        >
          <Coins className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            style={{ color: 'var(--adm-text)' }}
          >
            {Object.values(CURRENCIES).map((c) => (
              <option
                key={c.code}
                value={c.code}
                style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
              >
                {c.flag} {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
