import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../features/auth/api/authApi';
import { GlobalOrderAlertManager } from '../features/orders/components/GlobalOrderAlertManager';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, setUser, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Outlet />
      <GlobalOrderAlertManager />
    </>
  );
};
