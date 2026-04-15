'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useJobRequest, useJobMatches, useRunMatching } from '@/lib/api/hooks/useJobRequests';
import { useCreateOrder } from '@/lib/api/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { JOB_STATUS, MATCH_STATUS } from '@/lib/config/constants';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils/format';
import { ArrowLeft, Calendar, DollarSign, Star, Clock, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const jobId = parseInt(id);
  const router = useRouter();

  const { data: job, isLoading: jobLoading, error: jobError } = useJobRequest(jobId);
  const { data: matches, isLoading: matchesLoading } = useJobMatches(jobId);
  const createOrder = useCreateOrder();
  const runMatching = useRunMatching(jobId);

  const handleCreateOrder = async (match: any) => {
    try {
      const order = await createOrder.mutateAsync({
        match: match.id,
        amount: match.price_quote || '0',
      });
      toast.success('Orden creada exitosamente');
      router.push(`/orders/${order.id}`);
    } catch {
      toast.error('Error al crear la orden');
    }
  };

  const handleRunMatching = async () => {
    try {
      await runMatching.mutateAsync();
      toast.success('Matching ejecutado');
    } catch {
      toast.error('Error al buscar proveedores');
    }
  };

  if (jobLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="container max-w-3xl py-8 text-center">
        <p className="text-destructive font-medium">Error al cargar la solicitud</p>
        <p className="text-sm text-muted-foreground mt-1">{(jobError as Error).message}</p>
        <Link href="/jobs">
          <Button variant="ghost" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container max-w-3xl py-8 text-center">
        <p className="text-muted-foreground">Solicitud no encontrada</p>
        <Link href="/dashboard">
          <Button variant="ghost" className="mt-4">Volver al panel</Button>
        </Link>
      </div>
    );
  }

  const matchList = Array.isArray(matches) ? matches : (matches as any)?.results || [];

  return (
    <AuthGuard>
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {job.service_details?.name || 'Servicio solicitado'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Solicitud #{job.id} &middot; {formatRelativeTime(job.created_at)}
              </p>
            </div>
            <Badge variant={JOB_STATUS[job.status]?.color as any}>
              {JOB_STATUS[job.status]?.label || job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{job.details}</p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {job.preferred_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(job.preferred_date)}
              </div>
            )}
            {job.budget_estimate && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Presupuesto: {formatCurrency(job.budget_estimate)}
              </div>
            )}
          </div>

          {job.status === 'open' && (
            <Button
              onClick={handleRunMatching}
              disabled={runMatching.isPending}
              className="mt-2"
            >
              <Search className="h-4 w-4 mr-2" />
              {runMatching.isPending ? 'Buscando...' : 'Buscar Proveedores'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Matches */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Proveedores encontrados {matchList.length > 0 && `(${matchList.length})`}
        </h2>

        {matchesLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : matchList.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {job.status === 'open'
                  ? 'Aún no hay proveedores. Usa "Buscar Proveedores" para encontrar matches.'
                  : 'No hay proveedores asignados.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {matchList.map((match: any) => (
              <Card key={match.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {match.provider_details?.user_email || `Proveedor #${match.provider}`}
                        </p>
                        <Badge variant={MATCH_STATUS[match.status as keyof typeof MATCH_STATUS]?.color as any}>
                          {MATCH_STATUS[match.status as keyof typeof MATCH_STATUS]?.label || match.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {match.provider_details?.average_rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-500" />
                            {match.provider_details.average_rating.toFixed(1)}
                          </span>
                        )}
                        {match.score && (
                          <span>Match: {match.score.toFixed(0)}%</span>
                        )}
                        {match.price_quote && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatCurrency(match.price_quote)}
                          </span>
                        )}
                        {match.eta_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {match.eta_minutes} min
                          </span>
                        )}
                      </div>

                      {match.provider_notes && (
                        <p className="text-sm text-muted-foreground mt-1">{match.provider_notes}</p>
                      )}
                    </div>

                    {match.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateOrder(match)}
                        disabled={createOrder.isPending}
                      >
                        {createOrder.isPending ? 'Creando...' : 'Crear Orden'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
