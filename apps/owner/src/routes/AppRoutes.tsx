import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { RestaurantsPage } from '../features/restaurants/RestaurantsPage';
import { StorefrontThemePage } from '../features/theme/StorefrontThemePage';
import { BranchesPage } from '../features/branches/BranchesPage';
import { MenuPage } from '../features/menu/MenuPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { PaymentSettingsPage } from '../features/payments/PaymentSettingsPage';
import { StaffPage } from '../features/staff/StaffPage';
import { ROUTES } from '../constants/routes';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginForm />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterForm />} />

        {/* Protected Owner Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.RESTAURANTS} element={<RestaurantsPage />} />
          <Route path={ROUTES.RESTAURANT_THEME} element={<StorefrontThemePage />} />
          <Route path={ROUTES.BRANCHES} element={<BranchesPage />} />
          <Route path={ROUTES.MENU} element={<MenuPage />} />
          <Route path={ROUTES.STAFF} element={<StaffPage />} />
          <Route path={ROUTES.PAYMENTS} element={<PaymentSettingsPage />} />
          <Route path={ROUTES.BILLING} element={<PaymentSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
