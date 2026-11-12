import { useAdminAuthStore } from '../store/useAdminAuthStore.ts';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  public status: number;
  public errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions extends RequestInit {
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, params, headers = {}, ...customConfig } = options;

  const token = useAdminAuthStore.getState().token;
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

  const defaultHeaders: Record<string, string> = {};

  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
  };

  if (data !== undefined) {
    config.body = isFormData ? (data as FormData) : JSON.stringify(data);
  }

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const serverMessage =
        typeof responseData === 'object' && responseData && 'message' in responseData
          ? Array.isArray((responseData as { message: unknown }).message)
            ? (responseData as { message: string[] }).message.join(', ')
            : String((responseData as { message: unknown }).message)
          : undefined;

      const errors =
        typeof responseData === 'object' && responseData && 'errors' in responseData
          ? (responseData as { errors: string[] }).errors
          : undefined;

      if (response.status === 401) {
        const isLoginRequest = endpoint.includes('/login');
        if (!isLoginRequest) {
          useAdminAuthStore.getState().logout();
        }
        throw new ApiError(
          serverMessage || (isLoginRequest ? 'Invalid email or password.' : 'Super Admin session expired. Please sign in again.'),
          401,
          errors
        );
      }

      const message = serverMessage || response.statusText || 'An unexpected error occurred';
      throw new ApiError(message, response.status, errors);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network communication error',
      500
    );
  }
}

export const adminApiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', data }),
  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', data }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

