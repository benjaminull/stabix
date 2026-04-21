import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Match, PaginatedResponse, JobRequest, Service } from '../client';
import { endpoints } from '../endpoints';

interface MatchWithDetails extends Match {
  job_request_details?: JobRequest & { service_details: Service };
}

interface AcceptMatchData {
  price_quote?: string;
  eta_minutes?: number;
  provider_notes?: string;
}

export function useProviderMatches(status?: string) {
  return useQuery({
    queryKey: ['provider', 'matches', status],
    queryFn: () => {
      const params = status ? `?status=${status}` : '';
      return apiClient.get<PaginatedResponse<MatchWithDetails>>(
        `${endpoints.provider.matches}${params}`,
        { auth: true }
      );
    },
  });
}

export function useAcceptMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AcceptMatchData }) =>
      apiClient.post<Match>(endpoints.provider.matchAccept(id), data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'orders'] });
    },
  });
}

export function useRejectMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<Match>(endpoints.provider.matchReject(id), {}, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
    },
  });
}
