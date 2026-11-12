import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { AppLogo } from '../ui/AppLogo';
import { cn } from '../../lib/utils';
import { SIDEBAR_NAV_GROUPS, SETTINGS_NAV_ITEM } from '../../config/navigation.config';
import { usePermissions } from '../../hooks/usePermissions';

export const Sidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  branchCount?: number;
  restaurantCount?: number;
}> = ({
  isOpen,
  onClose,
  branchCount,
  restaurantCount,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPageAccess } = usePermissions();

  // Helper to dynamically resolve badges (e.g. branchCount, restaurantCount)
  const getBadgeCount = (badgeKey?: 'restaurantCount' | 'branchCount') => {
    if (badgeKey === 'restaurantCount') return restaurantCount;
    if (badgeKey === 'branchCount') return branchCount;
    return undefined;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-backdrop backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (~248px width) */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-[248px] flex flex-col justify-between bg-surface border-r border-border transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top: Logo on ONE line without Owner badge */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <AppLogo size="md" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden p-1.5 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups from Centralized Config */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {SIDEBAR_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => hasPageAccess(item.path));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-muted">
                  {group.groupTitle}
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const badgeCount = getBadgeCount(item.badgeKey);

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        'relative w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium transition-colors cursor-pointer text-left',
                        isActive
                          ? 'bg-primary-soft text-primary-soft-text font-semibold pl-3.5'
                          : 'text-muted hover:text-text hover:bg-surface-2'
                      )}
                    >
                      {/* Inset left accent bar for active item */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r" />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted')}>
                          <Icon size={17} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {/* Pulsing Green dot for Live Orders */}
                      {item.isLive && (
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                          </span>
                        </span>
                      )}

                      {/* Plain muted count for Branches / Tables */}
                      {badgeCount !== undefined && !item.isLive && (
                        <span className="text-[11px] text-muted font-normal">
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Settings Section */}
          {hasPageAccess(SETTINGS_NAV_ITEM.path) && (
            <div className="pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => handleNavigate(SETTINGS_NAV_ITEM.path)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium transition-colors cursor-pointer text-left',
                  location.pathname === SETTINGS_NAV_ITEM.path
                    ? 'bg-primary-soft text-primary-soft-text font-semibold'
                    : 'text-muted hover:text-text hover:bg-surface-2'
                )}
              >
                <SETTINGS_NAV_ITEM.icon size={17} className="shrink-0 text-muted" />
                <span>{SETTINGS_NAV_ITEM.label}</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
