import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, PaginatedResponse } from '../client';
import { endpoints } from '../endpoints';

// ── Types ───────────────────────────────────────────────

export interface AdminStats {
  total_providers: number;
  active_providers: number;
  total_orders: number;
  orders_this_month: number;
  revenue_this_month: number;
  pending_matches: number;
}

export interface AdminProvider {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  categories: { id: number; name: string }[];
  price_band: string;
  is_active: boolean;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  total_completed_orders: number;
  listings_count: number;
  orders_count: number;
  created_at: string;
}

export interface AdminProviderDetail extends AdminProvider {
  first_name: string;
  last_name: string;
  bio: string;
  radius_km: number;
  location_lat: number | null;
  location_lng: number | null;
  listings: {
    id: number;
    title: string;
    base_price: string;
    price_unit: string;
    is_active: boolean;
    service__name: string;
  }[];
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  order: number;
  services_count: number;
}

export interface AdminService {
  id: number;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  is_active: boolean;
  order: number;
}

export interface AdminOrder {
  id: number;
  client_name: string;
  provider_name: string;
  service_name: string;
  status: string;
  amount: string;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface AdminProviderCreateData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password?: string;
  bio?: string;
  price_band?: string;
  category_ids?: number[];
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
}

export interface AdminProviderCreateResponse extends AdminProviderDetail {
  generated_password: string;
}

export interface WorkingHour {
  id?: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// ── Hooks ───────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiClient.get<AdminStats>(endpoints.admin.stats, { auth: true }),
  });
}

export function useAdminProviders(params?: { search?: string; is_active?: string; category?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.is_active) searchParams.set('is_active', params.is_active);
  if (params?.category) searchParams.set('category', params.category);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'providers', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AdminProvider>>(
        `${endpoints.admin.providers}${qs ? `?${qs}` : ''}`,
        { auth: true }
      ),
  });
}

export function useAdminProviderDetail(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'provider', id],
    queryFn: () => apiClient.get<AdminProviderDetail>(endpoints.admin.providerDetail(id!), { auth: true }),
    enabled: !!id,
  });
}

export function useAdminUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      apiClient.patch<AdminProviderDetail>(endpoints.admin.providerUpdate(id), data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiClient.get<AdminCategory[]>(endpoints.admin.categories, { auth: true }),
  });
}

export function useAdminUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      apiClient.patch<AdminCategory>(endpoints.admin.categoryUpdate(id), data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useAdminServices(categoryId?: number) {
  const qs = categoryId ? `?category=${categoryId}` : '';
  return useQuery({
    queryKey: ['admin', 'services', categoryId],
    queryFn: () => apiClient.get<AdminService[]>(`${endpoints.admin.services}${qs}`, { auth: true }),
  });
}

export function useAdminUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      apiClient.patch<AdminService>(endpoints.admin.serviceUpdate(id), data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useAdminCreateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminProviderCreateData) =>
      apiClient.post<AdminProviderCreateResponse>(endpoints.admin.providerCreate, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useAdminProviderWorkingHours(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'provider', id, 'working-hours'],
    queryFn: () => apiClient.get<WorkingHour[]>(endpoints.admin.providerWorkingHours(id!), { auth: true }),
    enabled: !!id,
  });
}

export function useAdminUpdateWorkingHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkingHour[] }) =>
      apiClient.put<WorkingHour[]>(endpoints.admin.providerWorkingHours(id), data, { auth: true }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider', variables.id, 'working-hours'] });
    },
  });
}

export interface AdminListingCreateData {
  provider_id: number;
  service_id: number;
  title: string;
  description?: string;
  base_price: string;
  price_unit?: string;
  estimated_duration_minutes?: number;
  is_active?: boolean;
}

export function useAdminCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminListingCreateData) =>
      apiClient.post(endpoints.admin.listingCreate, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider'] });
    },
  });
}

export function useAdminDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(endpoints.admin.listingDelete(id), { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'provider'] });
    },
  });
}

export function useAdminOrders(params?: { status?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AdminOrder>>(
        `${endpoints.admin.orders}${qs ? `?${qs}` : ''}`,
        { auth: true }
      ),
  });
}
