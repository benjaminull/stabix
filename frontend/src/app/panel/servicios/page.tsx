'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminCategories,
  useAdminServices,
  useAdminUpdateCategory,
  useAdminUpdateService,
} from '@/lib/api/hooks/useAdmin';

export default function AdminServicios() {
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  const { data: categories, isLoading } = useAdminCategories();
  const { data: services } = useAdminServices(expandedCat ?? undefined);
  const updateCategory = useAdminUpdateCategory();
  const updateService = useAdminUpdateService();

  const toggleCategory = (id: number) => {
    setExpandedCat((prev) => (prev === id ? null : id));
  };

  const handleToggleCat = (catId: number, currentActive: boolean) => {
    updateCategory.mutate(
      { id: catId, data: { is_active: !currentActive } },
      {
        onSuccess: () => toast.success('Categoria actualizada'),
        onError: () => toast.error('Error'),
      }
    );
  };

  const handleToggleService = (serviceId: number, currentActive: boolean) => {
    updateService.mutate(
      { id: serviceId, data: { is_active: !currentActive } },
      {
        onSuccess: () => toast.success('Servicio actualizado'),
        onError: () => toast.error('Error'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Categorias y Servicios</h1>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse"
            />
          ))
        ) : (
          categories?.map((cat) => {
            const isExpanded = expandedCat === cat.id;
            return (
              <div key={cat.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Category row */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleCategory(cat.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white/30" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                      </p>
                      <p className="text-xs text-white/25">{cat.services_count} servicios</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCat(cat.id, cat.is_active);
                    }}
                    title={cat.is_active ? 'Desactivar categoria' : 'Activar categoria'}
                  >
                    {cat.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400/50" />
                    )}
                  </button>
                </div>

                {/* Services list */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] px-5 py-3 space-y-1">
                    {!services || services.length === 0 ? (
                      <p className="text-sm text-white/20 py-2">Sin servicios</p>
                    ) : (
                      services.map((svc) => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <span className="text-sm text-white/60">{svc.name}</span>
                          </div>
                          <button
                            onClick={() => handleToggleService(svc.id, svc.is_active)}
                            title={svc.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {svc.is_active ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400/50" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
