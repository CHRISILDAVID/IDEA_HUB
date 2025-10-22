/**
 * API Client for Frontend
 * Handles HTTP requests to Netlify serverless functions
 */

import { getStoredToken } from './auth-client';

const API_BASE_URL = '/.netlify/functions';

export interface ApiError {
  error: string;
  statusCode?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = getStoredToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const error = isJson 
        ? await response.json() 
        : { error: response.statusText };
      throw new Error(error.error || 'API request failed');
    }

    if (isJson) {
      return response.json();
    }

    return {} as T;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('GET request error:', { endpoint, error });
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('POST request error:', { endpoint, error });
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('PUT request error:', { endpoint, error });
      throw error;
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('PATCH request error:', { endpoint, error });
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('DELETE request error:', { endpoint, error });
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
