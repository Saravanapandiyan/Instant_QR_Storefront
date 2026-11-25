import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';

export function AdminPublicRoute() {
  const { user, token, isAuthenticated } = useAdminAuthStore();

  const isSuperAdmin =
    Boolean(token) &&
    isAuthenticated &&
    Boolean(user) &&
    (user?.role === 'SUPER_ADMIN' || user?.isPlatformAdmin === true);

  if (isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
