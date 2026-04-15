'use client';

import { use } from 'react';
import Link from 'next/link';
import { useOrder } from '@/lib/api/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatPanel } from '@/components/common/ChatPanel';
import { ORDER_STATUS } from '@/lib/config/constants';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { ArrowLeft, DollarSign, Calendar, User, Star } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';

const STATUS_STEPS = ['created', 'paid', 'in_progress', 'completed'] as const;

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus as any);
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIndex && !isCancelled;
        const label = ORDER_STATUS[step]?.label || step;

        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-2 rounded-full ${
                isActive ? 'bg-accent-500' : 'bg-muted'
              }`}
            />
            <span className={`text-[10px] ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = parseInt(id);
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-3xl py-8 text-center">
        <p className="text-destructive font-medium">Error al cargar la orden</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        <Link href="/orders">
          <Button variant="ghost" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-3xl py-8 text-center">
        <p className="text-muted-foreground">Orden no encontrada</p>
        <Link href="/dashboard">
          <Button variant="ghost" className="mt-4">Volver al panel</Button>
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Orden #{order.id}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(order.created_at)}
              </p>
            </div>
            <Badge variant={ORDER_STATUS[order.status]?.color as any}>
              {ORDER_STATUS[order.status]?.label || order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatCurrency(order.amount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{order.provider_email}</span>
            </div>
            {order.scheduled_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(order.scheduled_at)}</span>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <StatusTimeline currentStatus={order.status} />

          {/* Review button */}
          {order.status === 'completed' && (
            <Link href={`/orders/${order.id}/review`}>
              <Button variant="outline" size="sm" className="mt-2">
                <Star className="h-4 w-4 mr-1" />
                Dejar reseña
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Chat */}
      <ChatPanel orderId={orderId} />
    </div>
    </AuthGuard>
  );
}
