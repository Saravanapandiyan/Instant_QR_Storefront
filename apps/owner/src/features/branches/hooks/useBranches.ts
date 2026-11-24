import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '../api/branchesApi';
import { QUERY_KEYS } from '../../../constants/query-keys';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from '../../../components/ui';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '@instant-qr/shared-types';

export const useBranches = (restaurantId?: string) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const branchesKey = restaurantId
    ? QUERY_KEYS.branches.byRestaurant(restaurantId)
    : user?.id
    ? ['branches', 'mine', user.id]
    : QUERY_KEYS.branches.mine;

  // 1. Fetch branches
  const branchesQuery = useQuery({
    queryKey: branchesKey,
    queryFn: () =>
      restaurantId
        ? branchesApi.getBranchesByRestaurant(restaurantId)
        : branchesApi.getMyBranches(),
    enabled: Boolean(user?.id && token),
  });

  // Display error toast if initial get fails
  useEffect(() => {
    if (branchesQuery.isError && branchesQuery.error) {
      toast.error(
        (branchesQuery.error as any).message || 'Failed to load branches. Please refresh.',
        'Load Failed',
      );
    }
  }, [branchesQuery.isError, branchesQuery.error]);

  // 2. Create Branch Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBranchInput) => branchesApi.createBranch(data),
    onSuccess: (newBranch) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['branch-products'] });
      toast.success(`Branch "${newBranch.name}" created successfully!`, 'Branch Added');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create branch. Please check input.', 'Create Failed');
    },
  });

  // 3. Update Branch Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchInput }) =>
      branchesApi.updateBranch(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: branchesKey });
      const previousBranches = queryClient.getQueryData<Branch[]>(branchesKey);

      queryClient.setQueryData<Branch[]>(branchesKey, (old = []) =>
        old.map((b) => (b.id === id ? { ...b, ...data } : b)),
      );

      return { previousBranches };
    },
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Branch "${updatedBranch.name}" updated successfully!`, 'Saved');
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(branchesKey, context.previousBranches);
      }
      toast.error(err.message || 'Failed to update branch.', 'Update Failed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: branchesKey });
    },
  });

  // 4. Delete Branch Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: branchesKey });
      const previousBranches = queryClient.getQueryData<Branch[]>(branchesKey);

      queryClient.setQueryData<Branch[]>(branchesKey, (old = []) =>
        old.filter((b) => b.id !== id),
      );

      return { previousBranches };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      queryClient.invalidateQueries({ queryKey: ['restaurant-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Branch deleted successfully.', 'Deleted');
    },
    onError: (err: any, _id, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(branchesKey, context.previousBranches);
      }
      toast.error(err.message || 'Failed to delete branch.', 'Delete Failed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: branchesKey });
    },
  });

  return {
    branches: branchesQuery.data ?? [],
    isLoading: branchesQuery.isLoading,
    isError: branchesQuery.isError,
    error: branchesQuery.error,
    refetch: branchesQuery.refetch,
    createBranch: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateBranch: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteBranch: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
