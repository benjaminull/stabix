import { API_BASE_URL } from '../config/constants';

interface FetchOptions extends RequestInit {
  auth?: boolean;
  token?: string;
}

class APIClient {
  private baseURL: string;
  private tokenGetter: (() => string | null) | null = null;
  private tokenRefresher: (() => Promise<string | null>) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setTokenGetter(getter: () => string | null) {
    this.tokenGetter = getter;
  }

  setTokenRefresher(refresher: () => Promise<string | null>) {
    this.tokenRefresher = refresher;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { auth = false, token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Add authorization header
    if (auth && (token || this.tokenGetter)) {
      const accessToken = token || this.tokenGetter?.();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 - Try to refresh token
      if (response.status === 401 && auth && this.tokenRefresher) {
        const newToken = await this.tokenRefresher();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Network error'
      );
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText,
      }));
      if (error.detail) {
        throw new Error(error.detail);
      }
      if (error.error) {
        throw new Error(error.error);
      }
      // Handle DRF field-level validation errors: { "field": ["msg"] }
      if (typeof error === 'object') {
        const messages = Object.entries(error)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ');
        if (messages) throw new Error(messages);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new APIClient(API_BASE_URL);

// Type definitions for API responses
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone_verified: boolean;
  is_provider: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  order: number;
}

export interface Service {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  order: number;
}

export interface ProviderProfile {
  id: number;
  user_email: string;
  radius_km: number;
  price_band: 'budget' | 'standard' | 'premium' | 'luxury';
  average_rating: number;
  total_reviews: number;
  total_completed_orders: number;
  distance_km?: number;
  bio?: string;
  is_active?: boolean;
  is_verified?: boolean;
  average_response_time_minutes?: number;
  availability?: Record<string, any>;
  categories?: ServiceCategory[];
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface Listing {
  id: number;
  title: string;
  service_name: string;
  base_price: string;
  price_unit: string;
  provider_rating: number;
}

export interface JobRequest {
  id: number;
  user: number;
  service: number;
  service_details: Service;
  location: any;
  location_lat?: number;
  location_lng?: number;
  details: string;
  budget_estimate: string | null;
  status: 'open' | 'matched' | 'ordered' | 'cancelled';
  preferred_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  job_request: number;
  provider: number;
  provider_details: ProviderProfile;
  score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  eta_minutes: number | null;
  price_quote: string | null;
  provider_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  job_request: number;
  match: number;
  customer_email: string;
  provider_email: string;
  status: 'created' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  amount: string;
  payment_ref: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

export interface Message {
  id: number;
  order: number;
  sender: number;
  sender_email: string;
  sender_type: 'customer' | 'provider';
  text: string;
  is_read: boolean;
  created_at: string;
}
