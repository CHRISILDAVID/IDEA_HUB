/**
 * API Client for Netlify Serverless Functions
 * This client handles HTTP requests to backend API functions
 */

import { getStoredToken } from './auth';

// Base URL for API (relative to current domain in production)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

export interface ApiClientResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  [key: string]: any;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Make an HTTP request to a serverless function
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiClientResponse<T>> {
  const token = getStoredToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    if (!response.ok) {
      throw new ApiClientError(
        data.error || data.message || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

/**
 * API Client methods
 */
export const apiClient = {
  // GET request
  get: async <T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiClientResponse<T>> => {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }
    
    return request<T>(url, {
      method: 'GET',
    });
  },

  // POST request
  post: async <T = any>(endpoint: string, body?: any): Promise<ApiClientResponse<T>> => {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // PUT request
  put: async <T = any>(endpoint: string, body?: any): Promise<ApiClientResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // PATCH request
  patch: async <T = any>(endpoint: string, body?: any): Promise<ApiClientResponse<T>> => {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  // DELETE request
  delete: async <T = any>(endpoint: string): Promise<ApiClientResponse<T>> => {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};

export default apiClient;
