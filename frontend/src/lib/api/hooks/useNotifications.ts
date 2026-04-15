import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, PaginatedResponse } from '../client';
import { endpoints } from '../endpoints';

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  match_id: number | null;
  order_id: number | null;
}

export function useNotifications(is_read?: boolean) {
  return useQuery({
    queryKey: ['notifications', is_read],
    queryFn: () => {
      const params = is_read !== undefined ? `?is_read=${is_read}` : '';
      return apiClient.get<PaginatedResponse<Notification>>(
        `${endpoints.common.notifications}${params}`,
        { auth: true }
      );
    },
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () =>
      apiClient.get<{ unread_count: number }>(endpoints.common.notificationsUnreadCount, {
        auth: true,
      }),
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.patch<Notification>(endpoints.common.notificationRead(id), {}, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post(endpoints.common.notificationsMarkAllRead, {}, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
