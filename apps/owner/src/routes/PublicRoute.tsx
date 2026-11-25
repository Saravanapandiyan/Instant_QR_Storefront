import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ROUTES } from '../constants/routes';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, token, user } = useAuthStore();

  if (isAuthenticated && token && user) {
    return <Navigate to={ROUTES.DASHBOARD || '/'} replace />;
  }

  return <Outlet />;
};
