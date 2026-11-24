import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantsApi } from '../api/restaurantsApi';
import { QUERY_KEYS } from '../../../constants/query-keys';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from '../../../components/ui';
import type {
  Restaurant,
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from '@instant-qr/shared-types';

export const useRestaurants = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const restaurantsKey = user?.id ? ['restaurants', 'mine', user.id] : QUERY_KEYS.restaurants.mine;

  const query = useQuery({
    queryKey: restaurantsKey,
    queryFn: restaurantsApi.getMyRestaurants,
    enabled: Boolean(user?.id && token),
  });

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(
        (query.error as any).message || 'Failed to load restaurant concepts.',
        'Load Failed',
      );
    }
  }, [query.isError, query.error]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRestaurantInput | FormData) =>
      restaurantsApi.createRestaurant(data),
    onSuccess: (newRestaurant) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      toast.success(`Restaurant "${newRestaurant.name}" created!`, 'Concept Added');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create restaurant concept.', 'Create Failed');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRestaurantInput | FormData;
    }) => restaurantsApi.updateRestaurant(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      toast.success(`Restaurant "${updated.name}" updated!`, 'Saved');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update restaurant.', 'Update Failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => restaurantsApi.deleteRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches.all });
      toast.success('Restaurant concept deleted.', 'Deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete restaurant.', 'Delete Failed');
    },
  });

  return {
    restaurants: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createRestaurant: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRestaurant: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteRestaurant: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
