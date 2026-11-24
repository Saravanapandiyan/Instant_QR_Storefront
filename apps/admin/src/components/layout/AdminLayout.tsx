import React from 'react';
import { AdminSidebar } from './AdminSidebar.tsx';
import { AdminHeader } from './AdminHeader.tsx';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: 'var(--adm-bg)', color: 'var(--adm-text)' }}
    >
      {/* Fixed Navigation Sidebar (256px / w-64) */}
      <AdminSidebar />

      {/* Main View Area Offset by 256px */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Fixed Top Global Header with Scope Dropdowns & Currency */}
        <AdminHeader />

        {/* Content Body padded top to clear fixed header */}
        <main className="flex-1 pt-16">
          <div className="max-w-[1680px] mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
