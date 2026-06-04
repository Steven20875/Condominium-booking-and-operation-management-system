/**
 * Centralized API Client
 * Provides consistent API request handling with error management
 */

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

export const apiClient = {
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      token
    } = options;

    const finalHeaders = {
      ...DEFAULT_HEADERS,
      ...headers,
    };

    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  },

  get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', token });
  },

  post<T>(endpoint: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, token });
  },

  put<T>(endpoint: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, token });
  },

  delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  },
};
