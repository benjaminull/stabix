import { useQuery } from '@tanstack/react-query';
import { apiClient, ServiceCategory, Service, PaginatedResponse } from '../client';
import { endpoints } from '../endpoints';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ServiceCategory>>(endpoints.public.categories),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useServices(categorySlug?: string) {
  return useQuery({
    queryKey: ['services', categorySlug],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Service>>(
        `${endpoints.public.services}${categorySlug ? `?category=${categorySlug}` : ''}`
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
