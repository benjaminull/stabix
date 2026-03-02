import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Message } from '../client';

export function useMessages(orderId: number) {
  return useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => apiClient.get<Message[]>(`/orders/${orderId}/messages/`, { auth: true }),
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useSendMessage(orderId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { text: string }) =>
      apiClient.post<Message>(`/orders/${orderId}/messages/`, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
  });
}
