import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  Store,
  UtensilsCrossed,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: LucideIcon;
  isLive?: boolean;
  badgeKey?: 'restaurantCount' | 'branchCount';
  subItems?: { label: string; path: string }[];
}

export interface NavGroupConfig {
  groupTitle: string;
  items: NavItemConfig[];
}

export const SIDEBAR_NAV_GROUPS: NavGroupConfig[] = [
  {
    groupTitle: 'OPERATE',
    items: [
      {
        label: 'Overview',
        path: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        label: 'Live Orders',
        path: ROUTES.ORDERS,
        icon: ClipboardList,
        isLive: true,
      },
    ],
  },
  {
    groupTitle: 'MANAGE',
    items: [
      {
        label: 'Restaurants',
        path: ROUTES.RESTAURANTS,
        icon: Utensils,
        badgeKey: 'restaurantCount',
      },
      {
        label: 'Branches',
        path: ROUTES.BRANCHES,
        icon: Store,
        badgeKey: 'branchCount',
      },
      {
        label: 'Digital Menu',
        path: ROUTES.MENU,
        icon: UtensilsCrossed,
      },
      {
        label: 'Staff & Roles',
        path: ROUTES.STAFF,
        icon: Users,
      },
    ],
  },
  {
    groupTitle: 'BILLING',
    items: [
      {
        label: 'Payment Settings',
        path: ROUTES.PAYMENTS,
        icon: CreditCard,
      },
    ],
  },
];

export const SETTINGS_NAV_ITEM: NavItemConfig = {
  label: 'Settings',
  path: ROUTES.SETTINGS,
  icon: Settings,
};
