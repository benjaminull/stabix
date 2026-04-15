'use client';

import Link from 'next/link';
import { useJobRequests } from '@/lib/api/hooks/useJobRequests';
import { useOrders } from '@/lib/api/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JOB_STATUS, ORDER_STATUS } from '@/lib/config/constants';
import { formatRelativeTime } from '@/lib/utils/format';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests();
  const { data: orders, isLoading: loadingOrders } = useOrders();

  return (
    <AuthGuard>
    <div className="container py-8">
      <h1 className="mb-8 font-display text-3xl font-bold">Mi Panel</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis Solicitudes</CardTitle>
            <Link href="/jobs/new">
              <Button size="sm">Nueva Solicitud</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded" />
                ))}
              </div>
            ) : jobRequests?.results && jobRequests.results.length > 0 ? (
              <div className="space-y-3">
                {jobRequests.results.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="cursor-pointer rounded-lg border p-3 transition-colors hover:border-accent-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.service_details.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(job.created_at)}
                          </p>
                        </div>
                        <Badge variant={JOB_STATUS[job.status].color as any}>
                          {JOB_STATUS[job.status].label}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No tienes solicitudes aún</p>
            )}
            {jobRequests?.results && jobRequests.results.length > 0 && (
              <Link href="/jobs" className="block text-center mt-4">
                <Button variant="ghost" size="sm" className="text-accent-500 hover:text-accent-400">
                  Ver todas &rarr;
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded" />
                ))}
              </div>
            ) : orders?.results && orders.results.length > 0 ? (
              <div className="space-y-3">
                {orders.results.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="cursor-pointer rounded-lg border p-3 transition-colors hover:border-accent-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Orden #{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            ${order.amount}
                          </p>
                        </div>
                        <Badge variant={ORDER_STATUS[order.status].color as any}>
                          {ORDER_STATUS[order.status].label}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No tienes órdenes aún</p>
            )}
            {orders?.results && orders.results.length > 0 && (
              <Link href="/orders" className="block text-center mt-4">
                <Button variant="ghost" size="sm" className="text-accent-500 hover:text-accent-400">
                  Ver todas &rarr;
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  );
}
