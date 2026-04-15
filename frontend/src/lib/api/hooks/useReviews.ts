import { useQuery } from '@tanstack/react-query';
import { apiClient, Review } from '../client';
import { endpoints } from '../endpoints';

export function useProviderReviews(providerId: number) {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: () =>
      apiClient.get<Review[]>(endpoints.public.providerReviews(providerId)),
    enabled: !!providerId,
    staleTime: 60 * 1000, // 1 minute
  });
}
