import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Order, PaginatedResponse } from '../client';
import { endpoints } from '../endpoints';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Order>>(endpoints.customer.orders, { auth: true }),
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get<Order>(endpoints.customer.orderDetail(id), { auth: true }),
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
    }) => apiClient.post<Order>(endpoints.customer.orders, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
