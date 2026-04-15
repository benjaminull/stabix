'use client';

import { useState } from 'react';
import {
  useProviderOrders,
  useUpdateOrderStatus,
} from '@/lib/api/hooks/useProviderOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingBag,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  created: { label: 'Creada', color: 'bg-blue-600', icon: ShoppingBag },
  paid: { label: 'Pagada', color: 'bg-green-600', icon: DollarSign },
  in_progress: { label: 'En Progreso', color: 'bg-yellow-600', icon: PlayCircle },
  completed: { label: 'Completada', color: 'bg-purple-600', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-600', icon: XCircle },
};

const NEXT_STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  created: [{ value: 'paid', label: 'Marcar como Pagada' }],
  paid: [
    { value: 'in_progress', label: 'Iniciar Trabajo' },
    { value: 'cancelled', label: 'Cancelar' },
  ],
  in_progress: [
    { value: 'completed', label: 'Marcar como Completada' },
    { value: 'cancelled', label: 'Cancelar' },
  ],
  completed: [],
  cancelled: [],
};

export default function ProviderOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading } = useProviderOrders(statusFilter);
  const updateStatus = useUpdateOrderStatus();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await updateStatus.mutateAsync({
        id: selectedOrder.id,
        new_status: newStatus,
      });

      toast.success('Estado de la orden actualizado');
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  const openStatusDialog = (order: any) => {
    setSelectedOrder(order);
    setNewStatus('');
    setIsStatusDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Mis Órdenes</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 bg-brand-800" />
          ))}
        </div>
      </div>
    );
  }

  const orders = data?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Mis Órdenes</h1>
        <p className="text-brand-300 mt-1">
          Gestiona y actualiza el estado de tus órdenes
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('')}
          className={
            statusFilter === ''
              ? 'bg-accent-500'
              : 'border-brand-600 text-brand-300'
          }
          size="sm"
        >
          Todas
        </Button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className={
              statusFilter === status
                ? config.color
                : 'border-brand-600 text-brand-300'
            }
            size="sm"
          >
            {config.label}
          </Button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card className="bg-brand-800 border-brand-700">
          <CardContent className="py-12 text-center">
            <p className="text-brand-300">
              No hay órdenes {statusFilter ? `con estado "${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label}"` : ''}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig?.icon || ShoppingBag;
            const nextOptions = NEXT_STATUS_OPTIONS[order.status] || [];

            return (
              <Card key={order.id} className="bg-brand-800 border-brand-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Orden #{order.id}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <User className="h-4 w-4 text-brand-400" />
                        <span className="text-sm text-brand-300">
                          Cliente: {order.customer_email}
                        </span>
                      </div>
                    </div>
                    <Badge className={statusConfig?.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig?.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center text-brand-300">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span className="text-white font-bold">${order.amount}</span>
                    </div>

                    {order.scheduled_at && (
                      <div className="flex items-center text-brand-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(order.scheduled_at), "d 'de' MMMM, HH:mm", {
                          locale: es,
                        })}
                      </div>
                    )}

                    <div className="flex items-center text-brand-300">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </div>

                  {/* Timeline */}
                  {(order.started_at || order.completed_at) && (
                    <div className="bg-brand-700/50 p-3 rounded-lg space-y-1 text-sm">
                      {order.started_at && (
                        <div className="flex items-center text-brand-300">
                          <PlayCircle className="h-3 w-3 mr-2" />
                          Iniciada:{' '}
                          {format(new Date(order.started_at), "d/MM/yyyy HH:mm")}
                        </div>
                      )}
                      {order.completed_at && (
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="h-3 w-3 mr-2" />
                          Completada:{' '}
                          {format(new Date(order.completed_at), "d/MM/yyyy HH:mm")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {nextOptions.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => openStatusDialog(order)}
                        className="flex-1 bg-accent-500 hover:bg-accent-600"
                      >
                        Actualizar Estado
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-brand-800 text-white border-brand-700">
          <DialogHeader>
            <DialogTitle>Actualizar Estado de Orden</DialogTitle>
            <DialogDescription className="text-brand-300">
              Orden #{selectedOrder?.id} - Selecciona el nuevo estado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-brand-700 border-brand-600">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent className="bg-brand-700 border-brand-600">
                  {NEXT_STATUS_OPTIONS[selectedOrder?.status]?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                className="border-brand-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateStatus}
                className="bg-accent-500 hover:bg-accent-600"
                disabled={!newStatus || updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Actualizando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
