import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Zap, WifiOff, Coins, ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRestaurants } from '../../features/restaurants/hooks/useRestaurants';
import { useBranches } from '../../features/branches/hooks/useBranches';
import { useActiveStore } from '../../store/useActiveStore';
import { ROUTES } from '../../constants/routes';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onNewBranchClick?: () => void;
  branchCount?: number;
  restaurantCount?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  onNewBranchClick,
  branchCount,
  restaurantCount,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { restaurants = [] } = useRestaurants();
  const { branches = [] } = useBranches();
  const effectiveBranchCount = branchCount ?? branches.length;
  const effectiveRestaurantCount = restaurantCount ?? restaurants.length;

  const activeRestaurantId = useActiveStore((state) => state.activeRestaurantId);
  const activeRestaurant =
    restaurants.find((r) => r.id === activeRestaurantId) || restaurants[0] || null;

  const creditBalance =
    typeof activeRestaurant?.creditBalance === 'number'
      ? activeRestaurant.creditBalance
      : 100;

  // Network offline state monitoring
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isBillingPage = location.pathname.startsWith('/billing');

  return (
    <div className="min-h-screen w-full flex bg-bg text-text transition-colors overflow-x-hidden">
      {/* Sidebar (~248px) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        branchCount={effectiveBranchCount}
        restaurantCount={effectiveRestaurantCount}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNewBranchClick={onNewBranchClick}
        />

        {/* Global Offline Network Status Banner */}
        {!isOnline && (
          <div className="bg-rose-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Network Disconnected. The counter dashboard is offline and will automatically reconnect when online.
            </span>
          </div>
        )}

        {/* Global Low Credit & Emergency Grace Buffer Alert Banner (shown on all pages) */}
        {creditBalance < 20 && (
          <div
            className={`px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between gap-3 border-b shadow-2xs transition-colors ${
              creditBalance <= 0
                ? 'bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {creditBalance <= 0 ? (
                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Coins className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="min-w-0 truncate">
                {creditBalance <= 0 ? (
                  <span>
                    <strong className="font-bold text-red-600 dark:text-red-400">
                      {creditBalance <= -20 ? 'Credits Exhausted!' : '0 Credits Remaining!'}
                    </strong>{' '}
                    {creditBalance <= -20
                      ? '20/20 grace orders used — recharge to resume orders (deducted on top-up).'
                      : `${Math.max(0, 20 + creditBalance)}/20 grace orders left (used grace credits deduct on recharge).`}
                  </span>
                ) : (
                  <span>
                    <strong className="font-bold text-amber-700 dark:text-amber-300">
                      Low Credits:
                    </strong>{' '}
                    Only <strong>{creditBalance} {creditBalance === 1 ? 'order' : 'orders'}</strong> left. Top up to avoid interruption.
                  </span>
                )}
              </div>
            </div>

            {!isBillingPage && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.BILLING)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-transform active:scale-95 shadow-2xs shrink-0 whitespace-nowrap ${
                  creditBalance <= 0
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Top Up Credits</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
