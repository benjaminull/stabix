import { useQuery } from '@tanstack/react-query';
import { apiClient, Review } from '../client';

export function useProviderReviews(providerId: number) {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: () =>
      apiClient.get<Review[]>(`/providers/${providerId}/reviews/`),
    enabled: !!providerId,
    staleTime: 60 * 1000, // 1 minute
  });
}
