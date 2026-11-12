import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronRight,
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  LogOut,
  Sun,
  Moon,
  Shield,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { AppLogo } from '../ui/AppLogo';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ProfileModal } from './ProfileModal';
import { ROUTES } from '../../constants/routes';

interface HeaderProps {
  onMenuClick: () => void;
  onNewBranchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, setTheme } = useThemeStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Resolve current route title for breadcrumb
  const getRouteLabel = () => {
    switch (location.pathname) {
      case ROUTES.RESTAURANTS:
        return 'Restaurants';
      case ROUTES.BRANCHES:
        return 'Branches';
      case ROUTES.MENU:
        return 'Menu Catalog';
      case ROUTES.ORDERS:
        return 'Live Orders';
      case ROUTES.SETTINGS:
        return 'Settings';
      case ROUTES.DASHBOARD:
      default:
        return 'Dashboard';
    }
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  const formattedPhone = user?.phone
    ? `${user.countryCode || '+91'} ${user.phone}`
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
        {/* Main Header Bar */}
        <div className="h-16 w-full flex items-center justify-between px-4 sm:px-6">
          {/* Left: Desktop Breadcrumbs OR Mobile Logo + Hamburger */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile View: Hamburger Button + Logo Title */}
            <div className="flex lg:hidden items-center gap-2.5">
              <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open navigation menu"
                className="p-1.5 rounded-[8px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Menu size={20} />
              </button>
              <AppLogo size="sm" showTitle />
            </div>

            {/* Desktop View: Dynamic Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium">
              <span
                className="text-muted hover:text-text cursor-pointer transition-colors"
                onClick={() => navigate(ROUTES.DASHBOARD)}
              >
                Console
              </span>
              <ChevronRight size={13} className="text-muted/60" />
              <span className="text-text font-semibold">{getRouteLabel()}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 relative" ref={popoverRef}>
            {/* Desktop Only: Theme Toggle & Notifications */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />

              <button
                type="button"
                aria-label="View notifications"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-[8px] border border-border bg-surface text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Bell size={17} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
              </button>
            </div>

            {/* User DP Avatar Trigger (Click opens Popover) */}
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-[8px] border border-border bg-surface hover:bg-surface-2 text-text transition-all cursor-pointer focus:outline-none focus:border-primary"
              aria-expanded={isUserMenuOpen}
              aria-label="User account menu"
            >
              {/* DP Circle */}
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary-soft-text flex items-center justify-center font-bold text-xs shrink-0 select-none border border-primary/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Desktop Name & Role */}
              <div className="hidden sm:flex flex-col text-left min-w-0 pr-1">
                <span className="text-xs font-semibold text-text truncate max-w-[110px]">
                  {user?.name || 'Store Owner'}
                </span>
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </button>

            {/* User Dropdown Popover */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-[12px] border border-border bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Popover Header: User Details */}
                <div className="p-4 border-b border-border bg-surface-2/40">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary-soft text-primary-soft-text flex items-center justify-center font-bold text-base shrink-0 border border-primary/25">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text truncate">
                          {user?.name || 'Store Owner'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-[4px] bg-primary-soft text-primary-soft-text text-[9px] font-bold shrink-0">
                          {user?.role || 'Admin'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5 truncate">
                        <Mail size={11} className="shrink-0" />
                        <span className="truncate">{user?.email || 'owner@instantqr.com'}</span>
                      </div>

                      {/* Phone Number Display */}
                      <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
                        <Phone size={11} className="shrink-0" />
                        <span>{formattedPhone || 'No phone added'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile-Only Controls Section (Theme Changer & Notifications) */}
                <div className="lg:hidden p-3 border-b border-border bg-surface space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted px-1">
                    Quick Controls
                  </div>

                  {/* Theme Switcher in Popover */}
                  <div className="flex items-center justify-between px-2.5 py-2 rounded-[8px] bg-surface-2 text-xs">
                    <span className="text-muted font-medium">Theme Mode</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                          theme === 'light'
                            ? 'bg-surface text-primary font-bold shadow-xs'
                            : 'text-muted hover:text-text'
                        }`}
                        title="Light Theme"
                      >
                        <Sun size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-surface text-primary font-bold shadow-xs'
                            : 'text-muted hover:text-text'
                        }`}
                        title="Dark Theme"
                      >
                        <Moon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notifications in Popover */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] bg-surface-2 text-xs text-text hover:bg-surface-2/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-primary" />
                      <span>Notifications</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] font-semibold">
                      Live
                    </span>
                  </button>
                </div>

                {/* Account Actions */}
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-text hover:bg-surface-2 transition-colors cursor-pointer text-left"
                  >
                    <UserIcon size={15} className="text-primary shrink-0" />
                    <div className="flex-1">
                      <span>View & Edit Profile</span>
                      <p className="text-[10px] text-muted">Name, email, phone & password</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-semibold text-danger hover:bg-danger/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={15} className="shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile-Only Sub-Row: Breadcrumb under Logo & Title */}
        <div className="lg:hidden px-4 py-2 border-t border-border/60 bg-surface-2/30 flex items-center gap-1.5 text-xs font-medium text-muted">
          <span
            className="hover:text-text cursor-pointer transition-colors"
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            Console
          </span>
          <ChevronRight size={12} className="text-muted/60" />
          <span className="text-text font-semibold">{getRouteLabel()}</span>
        </div>
      </header>

      {/* Profile & Security Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
