import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../features/auth/api/authApi';
import { GlobalOrderAlertManager } from '../features/orders/components/GlobalOrderAlertManager';
import { ROUTES } from '../constants/routes';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, token, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let active = true;
    authApi
      .getMe()
      .then((freshUser) => {
        if (active && freshUser) {
          setUser(freshUser);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          logout();
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, token, setUser, logout]);

  if (!isAuthenticated || !token || !user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return (
    <>
      <Outlet />
      <GlobalOrderAlertManager />
    </>
  );
};
