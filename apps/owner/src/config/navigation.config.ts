import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  Utensils,
  Store,
  UtensilsCrossed,
  Users,
  CreditCard,
  Coins,
  Tv,
  BarChart3,
  HelpCircle,
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
      {
        label: 'Kitchen (KDS)',
        path: ROUTES.KDS,
        icon: ChefHat,
      },
      {
        label: 'TV Order Board',
        path: ROUTES.TV_DISPLAY,
        icon: Tv,
      },
      {
        label: 'Sales & Analytics',
        path: ROUTES.ANALYTICS,
        icon: BarChart3,
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
    groupTitle: 'BILLING & CREDITS',
    items: [
      {
        label: 'Plans & Credits',
        path: ROUTES.BILLING,
        icon: Coins,
      },
      {
        label: 'Payment Settings',
        path: ROUTES.PAYMENTS,
        icon: CreditCard,
      },
    ],
  },
  {
    groupTitle: 'SUPPORT',
    items: [
      {
        label: 'Help & Guides',
        path: ROUTES.HELP,
        icon: HelpCircle,
      },
    ],
  },
];
