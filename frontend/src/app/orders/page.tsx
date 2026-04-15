'use client';

import Link from 'next/link';
import { useOrders } from '@/lib/api/hooks/useOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ORDER_STATUS } from '@/lib/config/constants';
import { formatRelativeTime, formatCurrency } from '@/lib/utils/format';
import { ShoppingBag } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function OrdersPage() {
  const { data, isLoading } = useOrders();
  const orders = data?.results || [];

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
      <h1 className="text-2xl font-bold">Mis Ordenes</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tienes órdenes aún</p>
            <Link href="/search">
              <Button className="mt-4">Buscar servicios</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Orden #{order.id}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatCurrency(order.amount)} · {formatRelativeTime(order.created_at)}
                      </p>
                    </div>
                    <Badge variant={ORDER_STATUS[order.status]?.color as any}>
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
