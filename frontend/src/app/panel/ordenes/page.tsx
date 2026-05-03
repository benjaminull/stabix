'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminOrders } from '@/lib/api/hooks/useAdmin';
import { formatRelativeTime } from '@/lib/utils/format';

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  created: { label: 'Creada', variant: 'secondary' },
  paid: { label: 'Pagada', variant: 'default' },
  in_progress: { label: 'En Progreso', variant: 'default' },
  completed: { label: 'Completada', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export default function AdminOrdenes() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: ordersData, isLoading } = useAdminOrders({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const orders = ordersData?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Ordenes</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden flex-1 sm:w-64">
            <Search className="w-4 h-4 text-white/30 ml-3" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white placeholder:text-white/30 px-3 py-2.5 text-sm focus:outline-none w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/60 text-sm px-3 py-2.5 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="created">Creada</option>
            <option value="paid">Pagada</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                  #
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Proveedor
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                  Servicio
                </th>
                <th className="text-right text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                  Monto
                </th>
                <th className="text-center text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                  Estado
                </th>
                <th className="text-right text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 bg-white/[0.04] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-white/30 py-12 text-sm">
                    No se encontraron ordenes
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const sc = STATUS_CONFIG[order.status] || { label: order.status, variant: 'secondary' };
                  return (
                    <tr key={order.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 text-sm text-white/40">#{order.id}</td>
                      <td className="px-5 py-4 text-sm text-white/70">{order.client_name}</td>
                      <td className="px-5 py-4 text-sm text-white/70 hidden md:table-cell">{order.provider_name}</td>
                      <td className="px-5 py-4 text-sm text-white/50 hidden lg:table-cell">{order.service_name}</td>
                      <td className="px-5 py-4 text-sm text-white/70 text-right">
                        ${Number(order.amount).toLocaleString('es-CL')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={sc.variant as any} className="text-[10px]">
                          {sc.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/30 text-right hidden sm:table-cell">
                        {formatRelativeTime(order.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
