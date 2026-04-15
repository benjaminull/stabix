import { useQuery } from '@tanstack/react-query';
import { apiClient, PaginatedResponse, Listing } from '../client';
import { endpoints } from '../endpoints';

export function useProviderPublicListings(providerId: number) {
  return useQuery({
    queryKey: ['providerPublicListings', providerId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Listing>>(
        endpoints.public.providerListings(providerId)
      ),
    enabled: !!providerId,
  });
}
