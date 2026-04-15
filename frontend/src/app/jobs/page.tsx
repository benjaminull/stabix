'use client';

import Link from 'next/link';
import { useJobRequests } from '@/lib/api/hooks/useJobRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { JOB_STATUS } from '@/lib/config/constants';
import { formatRelativeTime } from '@/lib/utils/format';
import { Plus, Briefcase } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function JobsPage() {
  const { data, isLoading } = useJobRequests();
  const jobs = data?.results || [];

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
        <h1 className="text-2xl font-bold">Mis Solicitudes</h1>
        <Link href="/jobs/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tienes solicitudes aún</p>
            <Link href="/jobs/new">
              <Button className="mt-4">Crear tu primera solicitud</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.service_details?.name || 'Servicio'}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatRelativeTime(job.created_at)}
                        {job.budget_estimate && ` · $${job.budget_estimate}`}
                      </p>
                    </div>
                    <Badge variant={JOB_STATUS[job.status]?.color as any}>
                      {JOB_STATUS[job.status]?.label || job.status}
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
