'use client';

import Link from 'next/link';
import { useJobRequests } from '@/lib/api/hooks/useJobRequests';
import { useOrders } from '@/lib/api/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JOB_STATUS, ORDER_STATUS } from '@/lib/config/constants';
import { formatRelativeTime } from '@/lib/utils/format';

export default function DashboardPage() {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests();
  const { data: orders, isLoading: loadingOrders } = useOrders();

  return (
    <div className="container py-8">
      <h1 className="mb-8 font-display text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Job Requests</CardTitle>
            <Link href="/jobs/new">
              <Button size="sm">New Request</Button>
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
                {jobRequests.results.slice(0, 5).map((job) => (
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
              <p className="text-center text-muted-foreground">No job requests yet</p>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
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
                {orders.results.slice(0, 5).map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="cursor-pointer rounded-lg border p-3 transition-colors hover:border-accent-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
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
              <p className="text-center text-muted-foreground">No orders yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
