import { adminApiClient } from '../lib/api-client.ts';
import type {
  User,
  AuthResponse,
  LoginInput,
  BootstrapSuperAdminInput,
  AdminStatusResponse,
} from '@instant-qr/shared-types';

export const authApi = {
  // Check if platform has an initialized super admin
  getStatus: () => adminApiClient.get<AdminStatusResponse>('auth/admin/status'),

  // Bootstrap initial Super Admin or add with setup secret
  bootstrap: (data: BootstrapSuperAdminInput) =>
    adminApiClient.post<AuthResponse>('auth/admin/bootstrap', data),

  // Dedicated Super Admin Login
  login: (data: LoginInput) =>
    adminApiClient.post<AuthResponse>('auth/admin/login', data),

  // Fetch current authenticated Super Admin profile
  getMe: () => adminApiClient.get<User>('auth/me'),
};

