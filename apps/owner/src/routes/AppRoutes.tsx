import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { ImpersonatePage } from '../features/auth/ImpersonatePage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { useAuthStore } from '../store/useAuthStore';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { RestaurantsPage } from '../features/restaurants/RestaurantsPage';
import { StorefrontThemePage } from '../features/theme/StorefrontThemePage';
import { BranchesPage } from '../features/branches/BranchesPage';
import { MenuPage } from '../features/menu/MenuPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { KdsPage } from '../features/kds/KdsPage';
import { PaymentSettingsPage } from '../features/payments/PaymentSettingsPage';
import { BillingPage } from '../features/billing/BillingPage';
import { StaffPage } from '../features/staff/StaffPage';
import { QuickSetupPage } from '../features/quick-setup/QuickSetupPage';
import { TvDisplayPage } from '../features/tv/TvDisplayPage';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { OwnerHelpPage } from '../features/help/OwnerHelpPage';
import { usePermissions } from '../hooks/usePermissions';
import { ROUTES } from '../constants/routes';

const ownerBasename = (import.meta.env.BASE_URL || '/owner').replace(/\/+$/, '') || '/owner';

const DashboardRoute: React.FC = () => {
  const { hasPageAccess, getDefaultAccessibleRoute } = usePermissions();
  if (!hasPageAccess(ROUTES.DASHBOARD)) {
    return <Navigate to={getDefaultAccessibleRoute()} replace />;
  }
  return <DashboardPage />;
};

const FallbackRoute: React.FC = () => {
  const { isAuthenticated, token, user } = useAuthStore();
  if (!isAuthenticated || !token || !user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }
  return <NotFoundPage />;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter basename={ownerBasename}>
      <ScrollToTop />
      <Routes>
        {/* Guest / Public Auth Routes (Redirects to dashboard if already logged in) */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.AUTH.LOGIN} element={<LoginForm />} />
          <Route path={ROUTES.AUTH.REGISTER} element={<RegisterForm />} />
          <Route path="/auth/impersonate" element={<ImpersonatePage />} />
        </Route>

        {/* Public Kitchen / TV Display Route */}
        <Route path="/tv/:branchId" element={<TvDisplayPage />} />

        {/* Protected Owner Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardRoute />} />
          <Route path={ROUTES.QUICK_SETUP} element={<QuickSetupPage />} />
          <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.KDS} element={<KdsPage />} />
          <Route path={ROUTES.TV_DISPLAY} element={<TvDisplayPage />} />
          <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.RESTAURANTS} element={<RestaurantsPage />} />
          <Route path={ROUTES.RESTAURANT_THEME} element={<StorefrontThemePage />} />
          <Route path={ROUTES.BRANCHES} element={<BranchesPage />} />
          <Route path={ROUTES.MENU} element={<MenuPage />} />
          <Route path={ROUTES.STAFF} element={<StaffPage />} />
          <Route path={ROUTES.PAYMENTS} element={<PaymentSettingsPage />} />
          <Route path={ROUTES.BILLING} element={<BillingPage />} />
          <Route path="/billing/:tab" element={<BillingPage />} />
          <Route path={ROUTES.HELP} element={<OwnerHelpPage />} />
          {/* Settings removed - redirect to dashboard if visited */}
          <Route path="/settings" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="/settings/*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Route>

        {/* Fallback: If logged in -> 404 Oops Page; If not logged in -> redirect to /login */}
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  );
};
