import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useActiveStore } from '../store/useActiveStore';
import { useRestaurants } from '../features/restaurants/hooks/useRestaurants';
import { ROUTES } from '../constants/routes';
import type { StaffPermissions } from '@instant-qr/shared-types';

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  const activeRestaurantId = useActiveStore((state) => state.activeRestaurantId);
  const { restaurants = [] } = useRestaurants();

  const activeRestaurant = useMemo(() => {
    if (!activeRestaurantId) return restaurants[0] || null;
    return restaurants.find((r) => r.id === activeRestaurantId) || restaurants[0] || null;
  }, [restaurants, activeRestaurantId]);

  // Determine if user is the direct owner of the active restaurant
  const isOwner = useMemo(() => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (activeRestaurant && activeRestaurant.ownerId === user.id) return true;
    // Default fallback if user created restaurants
    if (user.role === 'ADMIN' && (!user.staffProfiles || user.staffProfiles.length === 0)) return true;
    return false;
  }, [user, activeRestaurant]);

  // Extract staff profile for current active restaurant
  const staffProfile = useMemo(() => {
    if (!user || isOwner || !user.staffProfiles) return null;
    const targetRestId = activeRestaurant?.id || activeRestaurantId;
    return user.staffProfiles.find((sp) => sp.restaurantId === targetRestId) || null;
  }, [user, isOwner, activeRestaurant, activeRestaurantId]);

  const assignedBranches: string[] = useMemo(() => {
    if (isOwner) return ['ALL'];
    if (staffProfile?.assignedBranches) return (staffProfile.assignedBranches as string[]) || ['ALL'];
    if ((activeRestaurant as any)?.branches) {
      return (activeRestaurant as any).branches.map((b: any) => b.id);
    }
    return ['ALL'];
  }, [isOwner, staffProfile, activeRestaurant]);

  const permissions: StaffPermissions | null = useMemo(() => {
    if (isOwner) return null; // full bypass
    if (staffProfile?.permissions) return staffProfile.permissions as StaffPermissions;
    if ((activeRestaurant as any)?._staffPermissions) {
      return (activeRestaurant as any)._staffPermissions as StaffPermissions;
    }
    return null;
  }, [isOwner, staffProfile, activeRestaurant]);

  // Helper: check if a specific action in a module is permitted
  const can = (
    moduleName: keyof StaffPermissions,
    action: string
  ): boolean => {
    if (isOwner) return true;
    if (!permissions) return false;
    const modulePerms = permissions[moduleName] as Record<string, boolean> | undefined;
    if (!modulePerms) return false;
    return Boolean(modulePerms[action]);
  };

  // Helper: check if a route / page can be accessed
  const hasPageAccess = (path: string): boolean => {
    if (isOwner) return true;
    if (!permissions) return false;

    // Check page-level permissions first if present
    const pages = (permissions as any).pages;

    switch (path) {
      case ROUTES.DASHBOARD:
        if (pages && typeof pages.overview === 'boolean') return pages.overview;
        return Boolean(permissions.overview?.view || permissions.orders?.view);
      case ROUTES.ANALYTICS:
        if (pages && typeof pages.analytics === 'boolean') return pages.analytics;
        return Boolean(permissions.overview?.view);
      case ROUTES.ORDERS:
        if (pages && typeof pages.orders === 'boolean') return pages.orders;
        return Boolean(permissions.orders?.view);
      case ROUTES.KDS:
        if (pages && typeof pages.kds === 'boolean') return pages.kds;
        return Boolean(permissions.orders?.view);
      case ROUTES.TV_DISPLAY:
        if (pages && typeof pages.tv === 'boolean') return pages.tv;
        return Boolean(permissions.orders?.view);
      case ROUTES.MENU:
        if (pages && typeof pages.menu === 'boolean') return pages.menu;
        return Boolean(permissions.menu?.view);
      case ROUTES.BRANCHES:
        if (pages && typeof pages.branches === 'boolean') return pages.branches;
        return Boolean(permissions.branches?.view);
      case ROUTES.PAYMENTS:
        if (pages && typeof pages.payments === 'boolean') return pages.payments;
        return Boolean(permissions.payments?.view);
      case ROUTES.BILLING:
      case ROUTES.BILLING_PLANS:
      case ROUTES.BILLING_HISTORY:
        if (pages && typeof pages.billing === 'boolean') return pages.billing;
        return Boolean(permissions.payments?.view);
      case ROUTES.STAFF:
        if (pages && typeof pages.staff === 'boolean') return pages.staff;
        return Boolean(permissions.staff?.view);
      case ROUTES.RESTAURANTS:
        // Only direct owners can manage restaurant brands
        return isOwner;
      default:
        return true;
    }
  };

  // Helper: find default accessible route for staff landing
  const getDefaultAccessibleRoute = (): string => {
    if (isOwner) return ROUTES.DASHBOARD;
    if (hasPageAccess(ROUTES.DASHBOARD)) return ROUTES.DASHBOARD;
    if (hasPageAccess(ROUTES.KDS)) return ROUTES.KDS;
    if (hasPageAccess(ROUTES.ORDERS)) return ROUTES.ORDERS;
    if (hasPageAccess(ROUTES.MENU)) return ROUTES.MENU;
    if (hasPageAccess(ROUTES.BRANCHES)) return ROUTES.BRANCHES;
    if (hasPageAccess(ROUTES.TV_DISPLAY)) return ROUTES.TV_DISPLAY;
    if (hasPageAccess(ROUTES.ANALYTICS)) return ROUTES.ANALYTICS;
    if (hasPageAccess(ROUTES.STAFF)) return ROUTES.STAFF;
    if (hasPageAccess(ROUTES.BILLING)) return ROUTES.BILLING;
    if (hasPageAccess(ROUTES.PAYMENTS)) return ROUTES.PAYMENTS;
    return ROUTES.DASHBOARD;
  };

  // Helper: check if user is allowed to access/view a given branch
  const isBranchAllowed = (branchId: string): boolean => {
    if (isOwner) return true;
    if (assignedBranches.includes('ALL') || assignedBranches.length === 0) return true;
    return assignedBranches.includes(branchId);
  };

  const isSuperAdmin = useMemo(() => {
    return user?.role === 'SUPER_ADMIN' || Boolean((user as any)?.isPlatformAdmin);
  }, [user]);

  return {
    isOwner,
    isSuperAdmin,
    userRole: isOwner ? 'OWNER' : (staffProfile?.role || 'STAFF'),
    staffProfile,
    assignedBranches,
    can,
    hasPageAccess,
    getDefaultAccessibleRoute,
    isBranchAllowed,
  };
};
