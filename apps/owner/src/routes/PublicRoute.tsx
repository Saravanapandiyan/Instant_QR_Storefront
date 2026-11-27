import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ROUTES } from '../constants/routes';
import { isStandalonePwa } from '../lib/pwa';

export const PublicRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, token, user } = useAuthStore();

  if (isAuthenticated && token && user) {
    return <Navigate to={ROUTES.DASHBOARD || '/'} replace />;
  }

  if (isStandalonePwa() && location.pathname === ROUTES.AUTH.WELCOME) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
};
