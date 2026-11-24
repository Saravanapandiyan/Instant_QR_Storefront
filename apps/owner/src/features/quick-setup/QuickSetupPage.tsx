import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickSetupWizard } from './QuickSetupWizard';
import { ROUTES } from '../../constants/routes';

export const QuickSetupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <QuickSetupWizard
        onComplete={() => navigate(ROUTES.DASHBOARD)}
        onCancel={() => navigate(ROUTES.DASHBOARD)}
      />
    </div>
  );
};
