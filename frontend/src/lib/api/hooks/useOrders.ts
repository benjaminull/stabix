import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Order, PaginatedResponse } from '../client';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Order>>('/orders/', { auth: true }),
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get<Order>(`/orders/${id}/`, { auth: true }),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      match: number;
      amount: string;
      scheduled_at?: string;
    }) => apiClient.post<Order>('/orders/', data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
