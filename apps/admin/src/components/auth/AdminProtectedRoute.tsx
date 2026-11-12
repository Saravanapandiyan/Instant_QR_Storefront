import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';

export function AdminProtectedRoute() {
  const { user, token, isAuthenticated } = useAdminAuthStore();
  const location = useLocation();

  const isSuperAdmin =
    Boolean(token) &&
    isAuthenticated &&
    Boolean(user) &&
    (user?.role === 'SUPER_ADMIN' || user?.isPlatformAdmin === true);

  if (!isSuperAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

