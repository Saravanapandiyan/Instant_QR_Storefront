import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';
import type {
  Restaurant,
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from '@instant-qr/shared-types';

export const restaurantsApi = {
  getMyRestaurants: async (): Promise<Restaurant[]> => {
    return apiClient.get<Restaurant[]>(API_ENDPOINTS.RESTAURANTS.MINE);
  },

  getRestaurantById: async (id: string): Promise<Restaurant> => {
    return apiClient.get<Restaurant>(API_ENDPOINTS.RESTAURANTS.BY_ID(id));
  },

  createRestaurant: async (data: CreateRestaurantInput | FormData): Promise<Restaurant> => {
    return apiClient.post<Restaurant>(API_ENDPOINTS.RESTAURANTS.BASE, data);
  },

  updateRestaurant: async (
    id: string,
    data: UpdateRestaurantInput | FormData,
  ): Promise<Restaurant> => {
    return apiClient.patch<Restaurant>(API_ENDPOINTS.RESTAURANTS.BY_ID(id), data);
  },

  deleteRestaurant: async (id: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.RESTAURANTS.BY_ID(id));
  },
};
