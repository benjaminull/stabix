import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Order, PaginatedResponse } from '../client';
import { endpoints } from '../endpoints';

export function useProviderOrders(status?: string) {
  return useQuery({
    queryKey: ['provider', 'orders', status],
    queryFn: () => {
      const params = status ? `?status=${status}` : '';
      return apiClient.get<PaginatedResponse<Order>>(
        `${endpoints.provider.orders}${params}`,
        { auth: true }
      );
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, new_status }: { id: number; new_status: string }) =>
      apiClient.patch<Order>(
        endpoints.provider.orderStatus(id),
        { new_status },
        { auth: true }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
