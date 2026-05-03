'use client';

import { HardHat, ShoppingCart, TrendingUp, Clock, Users, CheckCircle } from 'lucide-react';
import { useAdminStats } from '@/lib/api/hooks/useAdmin';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const cards = [
    {
      label: 'Proveedores Activos',
      value: stats ? `${stats.active_providers} / ${stats.total_providers}` : '-',
      icon: HardHat,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Ordenes Totales',
      value: stats?.total_orders ?? '-',
      icon: ShoppingCart,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Ordenes este Mes',
      value: stats?.orders_this_month ?? '-',
      icon: TrendingUp,
      color: 'text-accent-400',
      bg: 'bg-accent-500/10',
    },
    {
      label: 'Ingresos del Mes',
      value: stats ? `$${stats.revenue_this_month.toLocaleString('es-CL')}` : '-',
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Matches Pendientes',
      value: stats?.pending_matches ?? '-',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Total Proveedores',
      value: stats?.total_providers ?? '-',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Resumen</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <span className="inline-block w-16 h-7 bg-white/[0.06] rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
                <p className="text-sm text-white/40 mt-0.5">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
