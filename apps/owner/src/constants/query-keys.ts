export const QUERY_KEYS = {
  restaurants: {
    all: ['restaurants'] as const,
    mine: ['restaurants', 'mine'] as const,
    detail: (id: string) => ['restaurants', id] as const,
  },
  branches: {
    all: ['branches'] as const,
    mine: ['branches', 'mine'] as const,
    byRestaurant: (restaurantId?: string) => ['branches', 'restaurant', restaurantId] as const,
    detail: (id: string) => ['branches', id] as const,
    bySlug: (slug: string) => ['branches', 'slug', slug] as const,
  },
  categories: {
    byRestaurant: (restaurantId?: string) => ['categories', restaurantId] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },
  products: {
    allByRestaurant: (restaurantId?: string) => ['products', restaurantId] as const,
    byRestaurant: (restaurantId?: string, categoryId?: string, search?: string) =>
      ['products', restaurantId, categoryId, search] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  branchProducts: {
    menu: (branchId: string) => ['branch-products', 'menu', branchId] as const,
  },
} as const;
