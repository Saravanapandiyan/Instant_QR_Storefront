import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  ReceiptText,
  Sliders,
  Activity,
  LogOut,
  QrCode,
  Sun,
  Moon,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';
import { useAdminThemeStore } from '../../store/useAdminThemeStore.ts';

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    path: string;
    icon: any;
    badge?: string;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Overview', path: '/', icon: LayoutDashboard },
      { label: 'Restaurants & Tenants', path: '/restaurants', icon: Store, badge: 'Fleet' },
      { label: 'User Accounts', path: '/users', icon: Users },
      { label: 'Global Orders', path: '/orders', icon: ReceiptText },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { label: 'Platform Settings', path: '/settings', icon: Sliders },
      { label: 'System Health', path: '/system-health', icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const { user, logout } = useAdminAuthStore();
  const { theme, toggleTheme } = useAdminThemeStore();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col justify-between select-none border-r"
      style={{
        backgroundColor: 'var(--adm-surface)',
        borderColor: 'var(--adm-border)',
        color: 'var(--adm-text)',
      }}
    >
      <div className="flex flex-col">
        {/* Brand Header with Theme Switcher & ROOT Badge */}
        <div
          className="h-14 px-4 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--adm-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: 'var(--adm-primary)',
                color: 'var(--adm-primary-contrast)',
              }}
            >
              <QrCode className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-none" style={{ color: 'var(--adm-text)' }}>
                OrdZo
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold leading-tight mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                Control Plane
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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

            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-primary)',
              }}
            >
              ROOT
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <span
                className="px-2 text-[10px] font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--adm-muted)' }}
              >
                {sec.title}
              </span>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                          isActive ? 'font-semibold' : ''
                        }`
                      }
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? 'var(--adm-surface-subtle)' : 'transparent',
                        color: isActive ? 'var(--adm-primary)' : 'var(--adm-text)',
                        borderLeft: isActive
                          ? '3px solid var(--adm-primary)'
                          : '3px solid transparent',
                      })}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.2 rounded border"
                          style={{
                            backgroundColor: 'var(--adm-surface)',
                            borderColor: 'var(--adm-border)',
                            color: 'var(--adm-muted)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clean User Footer with Logout */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border"
              style={{
                backgroundColor: 'var(--adm-primary-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-primary)',
              }}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--adm-text)' }}>
                {user?.name || 'Super Admin'}
              </span>
              <span className="text-[10px] truncate" style={{ color: 'var(--adm-muted)' }}>
                {user?.email || 'admin@ordzo.io'}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg border hover:opacity-75 transition-opacity cursor-pointer"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-error)',
            }}
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
