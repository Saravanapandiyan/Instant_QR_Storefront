import React from 'react';
import { AdminSidebar } from './AdminSidebar.tsx';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--adm-bg)', color: 'var(--adm-text)' }}>
      {/* 256px Fixed Sidebar */}
      <AdminSidebar />

      {/* Main View Area Offset by 64 (256px) without top header */}
      <div className="pl-64">
        <main className="min-h-screen">
          <div className="max-w-[1680px] mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

