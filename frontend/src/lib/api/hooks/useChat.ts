import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Message } from '../client';
import { endpoints } from '../endpoints';

export function useMessages(orderId: number) {
  return useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => apiClient.get<Message[]>(endpoints.customer.orderMessages(orderId), { auth: true }),
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useSendMessage(orderId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { text: string }) =>
      apiClient.post<Message>(endpoints.customer.orderMessages(orderId), data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
  });
}
