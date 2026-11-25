import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../ui';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/useAuthStore';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuthStore();

  if (!isAuthenticated || !token || !user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner ring-8 ring-primary/5">
          <Compass className="w-10 h-10 animate-pulse text-primary" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary mb-3">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-hero font-bold text-text mb-2 tracking-tight">
          Oops! Page Not Found
        </h1>

        <p className="text-sm text-muted mb-8 leading-relaxed max-w-md">
          The page you are looking for doesn't exist, has been removed, or the URL might be mistyped.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(ROUTES.DASHBOARD || '/')}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Back to Dashboard
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
