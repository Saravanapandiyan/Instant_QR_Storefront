import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onNewBranchClick?: () => void;
  branchCount?: number;
  restaurantCount?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  onNewBranchClick,
  branchCount,
  restaurantCount,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-bg text-text transition-colors">
      {/* Sidebar (~248px) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        branchCount={branchCount}
        restaurantCount={restaurantCount}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNewBranchClick={onNewBranchClick}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
