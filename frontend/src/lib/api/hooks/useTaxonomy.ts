import { useQuery } from '@tanstack/react-query';
import { apiClient, ServiceCategory, Service, PaginatedResponse } from '../client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ServiceCategory>>('/categories/'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useServices(categorySlug?: string) {
  return useQuery({
    queryKey: ['services', categorySlug],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Service>>(
        `/services/${categorySlug ? `?category=${categorySlug}` : ''}`
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
