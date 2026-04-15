'use client';

import { useRouter } from 'next/navigation';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/api/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/format';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.results || [];
  const hasUnread = notifications.some((n) => !n.is_read);

  const handleClick = async (notification: any) => {
    if (!notification.is_read) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch {
      // handled by react-query
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="container max-w-2xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notificaciones</h1>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tienes notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !notification.is_read ? 'border-accent-500/50 bg-accent-500/5' : ''
              }`}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />
                      )}
                      <p className={`text-sm font-medium truncate ${!notification.is_read ? '' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {notification.action_url && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
