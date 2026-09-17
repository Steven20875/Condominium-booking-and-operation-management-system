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

export async function parseJsonResponse<T>(response: Response): Promise<{ data: T | null; errorText: string | null }> {
  const text = await response.text();
  if (!text) {
    return { data: null, errorText: null };
  }

  try {
    return { data: JSON.parse(text) as T, errorText: null };
  } catch {
    return { data: null, errorText: text.trim().slice(0, 300) || `Request failed with status ${response.status}.` };
  }
}

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

      const { data, errorText } = await parseJsonResponse<T>(response);
      const payload = data as any;

      if (!response.ok) {
        return {
          success: false,
          error: payload?.error || errorText || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        success: true,
        data: payload ?? ({} as T),
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
