import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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

  const token = useAuthStore.getState().token;

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

  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

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

  const response = await fetch(url, config);

  // If 401 Unauthorized, automatically log out
  if (response.status === 401 && token) {
    useAuthStore.getState().logout();
  }

  let responseData: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred while connecting to the server.';
    let errorDetails: string[] | undefined;

    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData.message)) {
        errorMessage = responseData.message.join(', ');
        errorDetails = responseData.message;
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
    }

    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  return responseData as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', data }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', data }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', data }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
