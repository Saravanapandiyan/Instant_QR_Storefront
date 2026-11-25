import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboardPage } from './features/dashboard/AdminDashboardPage.tsx';
import { AdminOrdersPage } from './features/orders/AdminOrdersPage.tsx';
import { AdminRestaurantsPage } from './features/restaurants/AdminRestaurantsPage.tsx';
import { AdminBranchesPage } from './features/branches/AdminBranchesPage.tsx';
import { AdminDishesPage } from './features/dishes/AdminDishesPage.tsx';
import { AdminUsersPage } from './features/users/AdminUsersPage.tsx';
import { AdminPlansPage } from './features/plans/AdminPlansPage.tsx';
import { AdminHelpPage } from './features/help/AdminHelpPage.tsx';
import { AdminBrandingPage } from './features/settings/AdminBrandingPage.tsx';
import { AdminStripeSettingsPage } from './features/settings/AdminStripeSettingsPage.tsx';
import { AdminLoginPage } from './features/auth/AdminLoginPage.tsx';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute.tsx';
import { AdminPublicRoute } from './components/auth/AdminPublicRoute.tsx';
import { AdminNotFoundPage } from './components/common/AdminNotFoundPage.tsx';
import { useAdminAuthStore } from './store/useAdminAuthStore.ts';
import { AdminToastContainer } from './components/ui/toast/AdminToastContainer.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

const adminBasename = (import.meta.env.BASE_URL || '/admin').replace(/\/+$/, '') || '/admin';

function AdminFallbackRoute() {
  const { user, token, isAuthenticated } = useAdminAuthStore();
  const isSuperAdmin =
    Boolean(token) &&
    isAuthenticated &&
    Boolean(user) &&
    (user?.role === 'SUPER_ADMIN' || user?.isPlatformAdmin === true);

  if (!isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <AdminNotFoundPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminToastContainer />
      <BrowserRouter basename={adminBasename}>
        <Routes>
          {/* Guest / Public Auth Route (Redirects to dashboard if already logged in) */}
          <Route element={<AdminPublicRoute />}>
            <Route path="/login" element={<AdminLoginPage />} />
          </Route>

          {/* Protected Platform Control Plane Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/" element={<AdminDashboardPage />} />
            <Route path="/restaurants" element={<AdminRestaurantsPage />} />
            <Route path="/branches" element={<AdminBranchesPage />} />
            <Route path="/dishes" element={<AdminDishesPage />} />
            <Route path="/users" element={<AdminUsersPage />} />
            <Route path="/orders" element={<AdminOrdersPage />} />
            <Route path="/plans" element={<AdminPlansPage />} />
            <Route path="/help" element={<AdminHelpPage />} />
            <Route path="/settings" element={<Navigate to="/settings/site" replace />} />
            <Route path="/settings/site" element={<AdminBrandingPage />} />
            <Route path="/settings/pay" element={<AdminStripeSettingsPage />} />
          </Route>

          {/* Fallback: If logged in -> 404 Oops Page; If not logged in -> redirect to /login */}
          <Route path="*" element={<AdminFallbackRoute />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
