import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { ImpersonatePage } from '../features/auth/ImpersonatePage';
import { ProtectedRoute } from './ProtectedRoute';
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
import { ROUTES } from '../constants/routes';

const ownerBasename = (import.meta.env.BASE_URL || '/owner').replace(/\/+$/, '') || '/owner';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter basename={ownerBasename}>
      <Routes>
        {/* Public Auth & Display Routes */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginForm />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterForm />} />
        <Route path="/auth/impersonate" element={<ImpersonatePage />} />
        <Route path="/tv/:branchId" element={<TvDisplayPage />} />

        {/* Protected Owner Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
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
        </Route>

        {/* Fallback to login */}
        <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
