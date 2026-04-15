import { useQuery } from '@tanstack/react-query';
import { apiClient, PaginatedResponse, ProviderProfile } from '../client';
import { endpoints } from '../endpoints';

interface UseProvidersParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  category?: string;
  q?: string;
  page?: number;
  min_rating?: number;
  price_band?: string;
}

export function useProviders(params: UseProvidersParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  return useQuery({
    queryKey: ['providers', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ProviderProfile>>(
        `${endpoints.public.providers}${queryString ? `?${queryString}` : ''}`
      ),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useProvider(id: number) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => apiClient.get<ProviderProfile>(endpoints.public.providerDetail(id)),
    enabled: !!id,
  });
}
