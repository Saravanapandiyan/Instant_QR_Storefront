export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  DASHBOARD: '/',
  RESTAURANTS: '/restaurants',
  RESTAURANT_THEME: '/restaurants/:restaurantId/theme',
  BRANCHES: '/branches',
  MENU: '/menu',
  ORDERS: '/orders',
  STAFF: '/staff',
  BILLING: '/billing',
  PAYMENTS: '/payments',
  SETTINGS: '/settings',
} as const;
