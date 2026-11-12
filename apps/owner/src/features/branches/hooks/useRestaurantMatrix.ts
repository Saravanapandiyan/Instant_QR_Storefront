import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchProductsApi } from '../api/branchProductsApi';
import { toast } from '../../../components/ui';

export const useRestaurantMatrix = (restaurantId?: string) => {
  const queryClient = useQueryClient();
  const matrixKey = ['restaurant-matrix', restaurantId];

  const query = useQuery({
    queryKey: matrixKey,
    queryFn: () => branchProductsApi.getRestaurantMatrix(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 0,
  });

  // 1. One-click Toggle In Stock / Sold Out for a specific branch
  const toggleMutation = useMutation({
    mutationFn: ({ branchId, productId }: { branchId: string; productId: string }) =>
      branchProductsApi.toggleAvailability(branchId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matrixKey });
      queryClient.invalidateQueries({ queryKey: ['branch-menu'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock status updated!', 'Availability Changed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update stock status.', 'Error');
    },
  });

  // 2. Enable / Disable or Override Price
  const overrideMutation = useMutation({
    mutationFn: ({
      branchId,
      productId,
      data,
    }: {
      branchId: string;
      productId: string;
      data: { isAvailable?: boolean; priceOverride?: number | null; isEnabled?: boolean };
    }) => branchProductsApi.updateOverride(branchId, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matrixKey });
      queryClient.invalidateQueries({ queryKey: ['branch-menu'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Branch pricing & status saved!', 'Saved');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update branch settings.', 'Error');
    },
  });

  // 3. Toggle product availability across all branches of this restaurant
  const toggleMasterMutation = useMutation({
    mutationFn: async ({
      productId,
      isAvailable,
      branchIds,
    }: {
      productId: string;
      isAvailable: boolean;
      branchIds: string[];
    }) => {
      const promises = branchIds.map((bId) =>
        branchProductsApi.updateOverride(bId, productId, { isAvailable }),
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matrixKey });
      queryClient.invalidateQueries({ queryKey: ['branch-menu'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Master stock status updated across branches!', 'Updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update master stock status.', 'Error');
    },
  });

  return {
    matrix: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    toggleAvailability: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    updateOverride: overrideMutation.mutateAsync,
    isUpdatingOverride: overrideMutation.isPending,
    toggleMasterProductAvailability: toggleMasterMutation.mutateAsync,
    isTogglingMaster: toggleMasterMutation.isPending,
  };
};
