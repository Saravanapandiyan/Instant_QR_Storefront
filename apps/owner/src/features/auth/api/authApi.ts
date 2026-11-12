import { apiClient } from '../../../lib/api-client';
import { API_ENDPOINTS } from '../../../constants/api-endpoints';
import type {
  LoginInput,
  RegisterInput,
  AuthResponse,
  User,
  UpdateProfileInput,
  ChangePasswordInput,
} from '@instant-qr/shared-types';

export const authApi = {
  login: async (credentials: LoginInput): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  getMe: async (): Promise<User> => {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  },

  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    return apiClient.patch<User>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
  },

  changePassword: async (data: ChangePasswordInput): Promise<{ message: string }> => {
    return apiClient.patch<{ message: string }>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },
};

