import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboardPage } from './features/dashboard/AdminDashboardPage.tsx';
import { AdminRestaurantsPage } from './features/restaurants/AdminRestaurantsPage.tsx';
import { AdminUsersPage } from './features/users/AdminUsersPage.tsx';
import { AdminLoginPage } from './features/auth/AdminLoginPage.tsx';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute.tsx';
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

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminToastContainer />
      <BrowserRouter basename={adminBasename}>
        <Routes>
          {/* Public Super Admin Authentication Route */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Protected Platform Control Plane Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/" element={<AdminDashboardPage />} />
            <Route path="/restaurants" element={<AdminRestaurantsPage />} />
            <Route path="/users" element={<AdminUsersPage />} />
            <Route path="/orders" element={<AdminDashboardPage />} />
            <Route path="/settings" element={<AdminDashboardPage />} />
            <Route path="/system-health" element={<AdminDashboardPage />} />
          </Route>

          {/* Fallback to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
