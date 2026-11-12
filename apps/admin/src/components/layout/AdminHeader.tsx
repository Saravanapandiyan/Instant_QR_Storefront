import { useLocation } from 'react-router-dom';
import { Search, Sun, Moon } from 'lucide-react';
import { useAdminThemeStore } from '../../store/useAdminThemeStore.ts';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Platform Overview',
  '/restaurants': 'Tenants & Franchises',
  '/users': 'Identities & Permissions',
  '/orders': 'Global Orders',
  '/settings': 'Platform Settings',
  '/system-health': 'System Health',
};

export function AdminHeader() {
  const location = useLocation();
  const { theme, toggleTheme } = useAdminThemeStore();
  const { user } = useAdminAuthStore();

  const title = ROUTE_TITLES[location.pathname] || 'Platform Control Plane';

  return (
    <header
      className="fixed top-0 left-64 right-0 h-14 z-40 px-6 flex items-center justify-between border-b backdrop-blur-md"
      style={{
        backgroundColor: 'var(--adm-surface)',
        borderColor: 'var(--adm-border)',
        color: 'var(--adm-text)',
      }}
    >
      {/* Clean Route Title */}
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-sm tracking-tight" style={{ color: 'var(--adm-text)' }}>
          {title}
        </h2>
      </div>

      {/* Global Command Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--adm-muted)' }}
          />
          <input
            type="text"
            placeholder="Search restaurants, orders, users, or audit logs..."
            className="w-full h-8 pl-8 pr-12 rounded-lg text-xs border transition-all focus:outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          />
          <kbd
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded text-[10px] font-mono border"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-muted)',
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Theme Toggle + User Avatar */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg border hover:opacity-100 transition-opacity cursor-pointer"
          style={{
            backgroundColor: 'var(--adm-surface-subtle)',
            borderColor: 'var(--adm-border)',
            color: 'var(--adm-text)',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>

        {/* Profile Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
          style={{
            backgroundColor: 'var(--adm-primary-subtle)',
            color: 'var(--adm-primary)',
            border: '1px solid var(--adm-border)',
          }}
          title={user?.email || 'Super Admin'}
        >
          {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
        </div>
      </div>
    </header>
  );
}
