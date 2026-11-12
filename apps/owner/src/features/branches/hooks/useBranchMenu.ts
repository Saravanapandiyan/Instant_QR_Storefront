import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchProductsApi, type BranchMenuResponse } from '../api/branchProductsApi';
import { toast } from '../../../components/ui';

export const useBranchMenu = (branchId?: string) => {
  const queryClient = useQueryClient();
  const menuKey = ['branch-menu', branchId];

  const query = useQuery({
    queryKey: menuKey,
    queryFn: () => branchProductsApi.getBranchMenu(branchId!),
    enabled: !!branchId,
  });

  // 1. One-click Toggle In Stock / Sold Out
  const toggleMutation = useMutation({
    mutationFn: (productId: string) =>
      branchProductsApi.toggleAvailability(branchId!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKey });
      toast.success('Availability updated!', 'Stock Changed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update availability.', 'Error');
    },
  });

  // 2. Enable / Disable or Override Price
  const overrideMutation = useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: { isAvailable?: boolean; priceOverride?: number | null; isEnabled?: boolean };
    }) => branchProductsApi.updateOverride(branchId!, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKey });
      toast.success('Branch dish status updated!', 'Saved');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update branch dish settings.', 'Error');
    },
  });

  return {
    branchMenu: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    toggleAvailability: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    updateOverride: overrideMutation.mutateAsync,
    isUpdatingOverride: overrideMutation.isPending,
  };
};
