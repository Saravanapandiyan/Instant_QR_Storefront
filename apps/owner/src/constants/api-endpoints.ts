export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  RESTAURANTS: {
    BASE: '/restaurants',
    MINE: '/restaurants/mine',
    BY_ID: (id: string) => `/restaurants/${id}`,
  },
  BRANCHES: {
    BASE: '/branches',
    MINE: '/branches/mine',
    BY_RESTAURANT: (restaurantId: string) => `/branches/restaurant/${restaurantId}`,
    BY_SLUG: (slug: string) => `/branches/slug/${slug}`,
    BY_ID: (id: string) => `/branches/${id}`,
  },
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    BY_RESTAURANT: (restaurantId: string) => `/categories/restaurant/${restaurantId}`,
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: string) => `/products/${id}`,
    BY_RESTAURANT: (restaurantId: string) => `/products/restaurant/${restaurantId}`,
  },
  BRANCH_PRODUCTS: {
    TOGGLE_AVAILABILITY: (branchId: string, productId: string) =>
      `/branch-products/${branchId}/${productId}/toggle-availability`,
    OVERRIDE: (branchId: string, productId: string) =>
      `/branch-products/${branchId}/${productId}`,
    MENU: (branchId: string) => `/branch-products/branch/${branchId}/menu`,
    MATRIX: (restaurantId: string) => `/branch-products/restaurant/${restaurantId}/matrix`,
  },
  ORDERS: {
    BASE: '/orders',
    BY_RESTAURANT: (restaurantId: string) => `/orders/restaurant/${restaurantId}`,
    UPDATE_STATUS: (orderId: string) => `/orders/${orderId}/status`,
    UPDATE_PAYMENT: (orderId: string) => `/orders/${orderId}/payment`,
    PAYMENT_SETTINGS: (restaurantId: string) => `/orders/restaurant/${restaurantId}/payment-settings`,
  },
  STAFF: {
    BASE: '/staff',
    BY_RESTAURANT: (restaurantId: string) => `/staff/restaurant/${restaurantId}`,
    BY_ID: (id: string) => `/staff/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/staff/${id}/toggle-active`,
  },
} as const;
