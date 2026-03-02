import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, JobRequest, Match, PaginatedResponse } from '../client';

export function useJobRequests() {
  return useQuery({
    queryKey: ['job-requests'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<JobRequest>>('/job-requests/', { auth: true }),
  });
}

export function useJobRequest(id: number) {
  return useQuery({
    queryKey: ['job-request', id],
    queryFn: () => apiClient.get<JobRequest>(`/job-requests/${id}/`, { auth: true }),
    enabled: !!id,
  });
}

export function useCreateJobRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      service: number;
      location_lat: number;
      location_lng: number;
      details: string;
      budget_estimate?: string;
      preferred_date?: string;
    }) => apiClient.post<JobRequest>('/job-requests/', data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-requests'] });
    },
  });
}

export function useRunMatching(jobRequestId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<Match[]>(`/job-requests/${jobRequestId}/match/`, {}, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-request', jobRequestId] });
      queryClient.invalidateQueries({ queryKey: ['matches', jobRequestId] });
    },
  });
}

export function useJobMatches(jobRequestId: number) {
  return useQuery({
    queryKey: ['matches', jobRequestId],
    queryFn: () =>
      apiClient.get<Match[]>(`/job-requests/${jobRequestId}/matches/`, { auth: true }),
    enabled: !!jobRequestId,
  });
}

export function useAcceptMatch(matchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: {
      price_quote?: string;
      eta_minutes?: number;
      provider_notes?: string;
    }) => apiClient.post<Match>(`/matches/${matchId}/accept/`, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
