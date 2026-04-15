'use client';

import { useState } from 'react';
import {
  useProviderMatches,
  useAcceptMatch,
  useRejectMatch,
} from '@/lib/api/hooks/useProviderMatches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  WhatsAppButton,
  generateWhatsAppMessage,
} from '@/components/common/WhatsAppButton';
import {
  Check,
  X,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProviderMatchesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data, isLoading } = useProviderMatches(statusFilter);
  const acceptMatch = useAcceptMatch();
  const rejectMatch = useRejectMatch();

  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [quoteData, setQuoteData] = useState({
    price_quote: '',
    eta_minutes: '',
    provider_notes: '',
  });

  const handleAccept = async (matchId: number) => {
    setSelectedMatch(data?.results.find((m: any) => m.id === matchId));
    setIsAcceptDialogOpen(true);
  };

  const handleSubmitAccept = async () => {
    if (!selectedMatch) return;

    try {
      await acceptMatch.mutateAsync({
        id: selectedMatch.id,
        data: {
          price_quote: quoteData.price_quote || undefined,
          eta_minutes: quoteData.eta_minutes
            ? parseInt(quoteData.eta_minutes)
            : undefined,
          provider_notes: quoteData.provider_notes || undefined,
        },
      });

      toast.success('Solicitud aceptada exitosamente');
      setIsAcceptDialogOpen(false);
      setQuoteData({ price_quote: '', eta_minutes: '', provider_notes: '' });
    } catch (error) {
      toast.error('Error al aceptar la solicitud');
    }
  };

  const handleReject = async (matchId: number) => {
    if (!confirm('¿Estás seguro de que quieres rechazar esta solicitud?')) {
      return;
    }

    try {
      await rejectMatch.mutateAsync(matchId);
      toast.success('Solicitud rechazada');
    } catch (error) {
      toast.error('Error al rechazar la solicitud');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Solicitudes</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 bg-brand-800" />
          ))}
        </div>
      </div>
    );
  }

  const matches = data?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Solicitudes de Trabajo</h1>
        <p className="text-brand-300 mt-1">
          Revisa y responde a las solicitudes de clientes
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2">
        {['pending', 'accepted', 'rejected'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className={
              statusFilter === status
                ? 'bg-accent-500'
                : 'border-brand-600 text-brand-300'
            }
          >
            {status === 'pending' && 'Pendientes'}
            {status === 'accepted' && 'Aceptadas'}
            {status === 'rejected' && 'Rechazadas'}
          </Button>
        ))}
      </div>

      {matches.length === 0 ? (
        <Card className="bg-brand-800 border-brand-700">
          <CardContent className="py-12 text-center">
            <p className="text-brand-300">
              No hay solicitudes {statusFilter === 'pending' ? 'pendientes' : statusFilter}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match: any) => {
            const jobRequest = match.job_request_details;
            const service = jobRequest?.service_details;

            return (
              <Card key={match.id} className="bg-brand-800 border-brand-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {service?.name || 'Servicio solicitado'}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <User className="h-4 w-4 text-brand-400" />
                        <span className="text-sm text-brand-300">
                          Match Score: {match.score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        match.status === 'pending'
                          ? 'default'
                          : match.status === 'accepted'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        match.status === 'pending'
                          ? 'bg-yellow-600'
                          : match.status === 'accepted'
                          ? 'bg-green-600'
                          : ''
                      }
                    >
                      {match.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Job Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {jobRequest?.preferred_date && (
                      <div className="flex items-center text-brand-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(jobRequest.preferred_date).toLocaleDateString(
                          'es-ES'
                        )}
                      </div>
                    )}
                    {jobRequest?.budget_estimate && (
                      <div className="flex items-center text-brand-300">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Presupuesto estimado: ${jobRequest.budget_estimate}
                      </div>
                    )}
                    <div className="flex items-center text-brand-300">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDistanceToNow(new Date(match.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </div>

                  {jobRequest?.details && (
                    <div>
                      <p className="text-sm font-medium text-brand-200 mb-1">
                        Detalles:
                      </p>
                      <p className="text-sm text-brand-300">
                        {jobRequest.details}
                      </p>
                    </div>
                  )}

                  {/* Match Response */}
                  {match.status === 'accepted' && (
                    <div className="bg-brand-700/50 p-3 rounded-lg space-y-2">
                      {match.price_quote && (
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                          <span className="text-white">
                            Cotización: ${match.price_quote}
                          </span>
                        </div>
                      )}
                      {match.eta_minutes && (
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-blue-400" />
                          <span className="text-white">
                            Tiempo estimado: {match.eta_minutes} minutos
                          </span>
                        </div>
                      )}
                      {match.provider_notes && (
                        <p className="text-sm text-brand-300 mt-2">
                          {match.provider_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {match.status === 'pending' && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        onClick={() => handleAccept(match.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={acceptMatch.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Aceptar
                      </Button>
                      <Button
                        onClick={() => handleReject(match.id)}
                        variant="destructive"
                        className="flex-1"
                        disabled={rejectMatch.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {/* WhatsApp button for accepted matches */}
                  {match.status === 'accepted' && jobRequest && (jobRequest.guest_phone || jobRequest.customer_phone) && (
                    <WhatsAppButton
                      phoneNumber={jobRequest.guest_phone || jobRequest.customer_phone || ''}
                      message={generateWhatsAppMessage({
                        serviceName: service?.name || '',
                        preferredDate: jobRequest.preferred_date,
                        details: jobRequest.details,
                      })}
                      className="w-full"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Accept Match Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="bg-brand-800 text-white border-brand-700">
          <DialogHeader>
            <DialogTitle>Aceptar Solicitud</DialogTitle>
            <DialogDescription className="text-brand-300">
              Proporciona detalles adicionales para el cliente (opcional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="price_quote">Tu Cotización ($)</Label>
              <Input
                id="price_quote"
                type="number"
                step="0.01"
                value={quoteData.price_quote}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, price_quote: e.target.value })
                }
                className="bg-brand-700 border-brand-600"
                placeholder="Precio estimado"
              />
            </div>

            <div>
              <Label htmlFor="eta_minutes">Tiempo estimado (minutos)</Label>
              <Input
                id="eta_minutes"
                type="number"
                value={quoteData.eta_minutes}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, eta_minutes: e.target.value })
                }
                className="bg-brand-700 border-brand-600"
                placeholder="Ej: 60"
              />
            </div>

            <div>
              <Label htmlFor="provider_notes">Notas adicionales</Label>
              <Textarea
                id="provider_notes"
                value={quoteData.provider_notes}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, provider_notes: e.target.value })
                }
                className="bg-brand-700 border-brand-600"
                rows={3}
                placeholder="Información adicional para el cliente..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAcceptDialogOpen(false)}
                className="border-brand-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAccept}
                className="bg-green-600 hover:bg-green-700"
                disabled={acceptMatch.isPending}
              >
                {acceptMatch.isPending ? 'Aceptando...' : 'Confirmar Aceptación'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
