import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type Category,
} from '../api/menu-api';
import { QUERY_KEYS } from '../../../constants/query-keys';

export function useMenu(restaurantId?: string, filters?: { categoryId?: string; search?: string }) {
  const queryClient = useQueryClient();

  // Cache keys from centralized factory
  const categoriesKey = QUERY_KEYS.categories.byRestaurant(restaurantId);
  const productsKey = QUERY_KEYS.products.byRestaurant(restaurantId, filters?.categoryId, filters?.search);
  const allProductsForBranchKey = QUERY_KEYS.products.allByRestaurant(restaurantId);

  // 1. Fetch Categories (5 minutes cache)
  const categoriesQuery = useQuery({
    queryKey: categoriesKey,
    queryFn: () => getCategories(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Products (Zero-flicker on tab switch or search)
  const productsQuery = useQuery({
    queryKey: productsKey,
    queryFn: () => getProducts(restaurantId!, filters),
    enabled: !!restaurantId,
    placeholderData: keepPreviousData,
  });

  // 3. Create Category
  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (newCategory) => {
      queryClient.setQueryData<Category[]>(categoriesKey, (old = []) => [...old, newCategory]);
      queryClient.invalidateQueries({ queryKey: categoriesKey });
    },
  });

  // 4. Update Category with Optimistic UI & Rollback
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategory(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: categoriesKey });
      const previousCategories = queryClient.getQueryData<Category[]>(categoriesKey);

      // Optimistically update category in cache immediately (0ms)
      queryClient.setQueryData<Category[]>(categoriesKey, (old = []) =>
        old.map((cat) => (cat.id === id ? { ...cat, ...data } : cat)),
      );

      return { previousCategories };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(categoriesKey, context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey });
    },
  });

  // 5. Delete Category with Optimistic UI & Rollback
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: categoriesKey });
      const previousCategories = queryClient.getQueryData<Category[]>(categoriesKey);

      // Optimistically remove category from screen immediately (0ms)
      queryClient.setQueryData<Category[]>(categoriesKey, (old = []) =>
        old.filter((cat) => cat.id !== categoryId),
      );

      return { previousCategories };
    },
    onError: (_err, _categoryId, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(categoriesKey, context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      queryClient.invalidateQueries({ queryKey: allProductsForBranchKey });
    },
  });

  // 6. Create Product
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allProductsForBranchKey });
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
    },
  });

  // 7. Update Product with Optimistic UI & Rollback
  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      data,
      formData,
    }: {
      id: string;
      data?: FormData | Partial<Product>;
      formData?: FormData;
    }) => {
      const payload = data || formData;
      if (!payload) throw new Error('No payload provided for product update');
      return updateProduct(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey });
      queryClient.invalidateQueries({ queryKey: allProductsForBranchKey });
      queryClient.invalidateQueries({ queryKey: categoriesKey });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productsKey });
      queryClient.invalidateQueries({ queryKey: allProductsForBranchKey });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
    },
  });

  // 8. Delete Product with Optimistic UI & Rollback
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: productsKey });
      const previousProducts = queryClient.getQueryData<Product[]>(productsKey);

      // Instantly remove product from screen in 0ms
      queryClient.setQueryData<Product[]>(productsKey, (old = []) =>
        old.filter((p) => p.id !== productId),
      );

      return { previousProducts };
    },
    onError: (_err, _productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(productsKey, context.previousProducts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: allProductsForBranchKey });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isCategoriesLoading: categoriesQuery.isLoading,
    products: productsQuery.data ?? [],
    isProductsLoading: productsQuery.isLoading,
    createCategory: createCategoryMutation.mutateAsync,
    isCreatingCategory: createCategoryMutation.isPending,
    updateCategory: updateCategoryMutation.mutateAsync,
    isUpdatingCategory: updateCategoryMutation.isPending,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    createProduct: createProductMutation.mutateAsync,
    isCreatingProduct: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutateAsync,
    isUpdatingProduct: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutateAsync,
    refetchProducts: productsQuery.refetch,
  };
}
