'use client';

import { useState } from 'react';
import {
  Search,
  Star,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ChevronRight,
  X,
  Plus,
  Copy,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  useAdminProviders,
  useAdminProviderDetail,
  useAdminUpdateProvider,
  useAdminCategories,
  useAdminServices,
  useAdminCreateProvider,
  useAdminCreateListing,
  useAdminDeleteListing,
  useAdminProviderWorkingHours,
  useAdminUpdateWorkingHours,
  type AdminProvider,
  type AdminProviderCreateData,
  type WorkingHour,
} from '@/lib/api/hooks/useAdmin';

const PRICE_LABELS: Record<string, string> = {
  budget: 'Economico',
  standard: 'Estandar',
  premium: 'Premium',
  luxury: 'Luxury',
};

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function AdminProveedores() {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showListingForm, setShowListingForm] = useState(false);

  const { data: providersData, isLoading } = useAdminProviders({
    search: search || undefined,
    is_active: filterActive || undefined,
  });
  const { data: detail } = useAdminProviderDetail(selectedId);
  const { data: categories } = useAdminCategories();
  const { data: services } = useAdminServices();
  const updateProvider = useAdminUpdateProvider();
  const createProvider = useAdminCreateProvider();
  const createListing = useAdminCreateListing();
  const deleteListing = useAdminDeleteListing();
  const { data: workingHours } = useAdminProviderWorkingHours(selectedId);
  const updateWorkingHours = useAdminUpdateWorkingHours();

  const providers = providersData?.results || [];

  const handleToggle = (provider: AdminProvider, field: 'is_active' | 'is_verified') => {
    updateProvider.mutate(
      { id: provider.id, data: { [field]: !provider[field] } },
      {
        onSuccess: () => toast.success(field === 'is_active' ? 'Estado actualizado' : 'Verificacion actualizada'),
        onError: () => toast.error('Error al actualizar'),
      }
    );
  };

  const handleDetailUpdate = (field: string, value: any) => {
    if (!selectedId) return;
    updateProvider.mutate(
      { id: selectedId, data: { [field]: value } },
      {
        onSuccess: () => toast.success('Actualizado'),
        onError: () => toast.error('Error al actualizar'),
      }
    );
  };

  const handleToggleWorkingHour = (hour: WorkingHour) => {
    if (!selectedId || !workingHours) return;
    const updated = workingHours.map((h) =>
      h.weekday === hour.weekday && h.start_time === hour.start_time && h.end_time === hour.end_time
        ? { ...h, is_active: !h.is_active }
        : h
    );
    updateWorkingHours.mutate(
      { id: selectedId, data: updated },
      {
        onSuccess: () => toast.success('Horario actualizado'),
        onError: () => toast.error('Error al actualizar horario'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Proveedores</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden flex-1 sm:w-64">
            <Search className="w-4 h-4 text-white/30 ml-3" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white placeholder:text-white/30 px-3 py-2.5 text-sm focus:outline-none w-full"
            />
          </div>
          {/* Filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/60 text-sm px-3 py-2.5 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          {/* Create button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 text-brand-900 rounded-xl text-sm font-medium hover:bg-accent-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar Proveedor</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                  Proveedor
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Categorias
                </th>
                <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                  Rating
                </th>
                <th className="text-center text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3">
                  Estado
                </th>
                <th className="text-center text-xs font-medium text-white/40 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                  Verificado
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 bg-white/[0.04] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-white/30 py-12 text-sm">
                    No se encontraron proveedores
                  </td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-white/30">{p.email}</p>
                        {p.phone && <p className="text-xs text-white/20">{p.phone}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-white/70">{p.average_rating.toFixed(1)}</span>
                        <span className="text-xs text-white/25">({p.total_reviews})</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(p, 'is_active'); }}
                        title={p.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {p.is_active ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400/50 mx-auto" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center hidden sm:table-cell">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(p, 'is_verified'); }}
                        title={p.is_verified ? 'Quitar verificacion' : 'Verificar'}
                      >
                        <ShieldCheck
                          className={`w-5 h-5 mx-auto ${p.is_verified ? 'text-blue-400' : 'text-white/15'}`}
                        />
                      </button>
                    </td>
                    <td className="px-2 py-4">
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-brand-900 border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">{detail.name}</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/30 text-xs mb-1">Email</p>
                  <p className="text-white/70">{detail.email}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-1">Telefono</p>
                  <p className="text-white/70">{detail.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white/70">{detail.average_rating.toFixed(1)}</span>
                    <span className="text-white/30">({detail.total_reviews} resenas)</span>
                  </div>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-1">Ordenes</p>
                  <p className="text-white/70">{detail.total_completed_orders} completadas</p>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Activo</span>
                  <button
                    onClick={() => handleDetailUpdate('is_active', !detail.is_active)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      detail.is_active ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        detail.is_active ? 'left-[26px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Verificado</span>
                  <button
                    onClick={() => handleDetailUpdate('is_verified', !detail.is_verified)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      detail.is_verified ? 'bg-blue-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        detail.is_verified ? 'left-[26px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Rango de precio</p>
                  <div className="flex gap-2">
                    {['budget', 'standard', 'premium', 'luxury'].map((band) => (
                      <button
                        key={band}
                        onClick={() => handleDetailUpdate('price_band', band)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          detail.price_band === band
                            ? 'bg-accent-500 text-brand-900'
                            : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                        }`}
                      >
                        {PRICE_LABELS[band]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Categorias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories?.map((cat) => {
                      const selected = detail.categories.some((c) => c.id === cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            const newIds = selected
                              ? detail.categories.filter((c) => c.id !== cat.id).map((c) => c.id)
                              : [...detail.categories.map((c) => c.id), cat.id];
                            handleDetailUpdate('category_ids', newIds);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            selected
                              ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                              : 'bg-white/[0.04] text-white/30 border border-transparent hover:bg-white/[0.08]'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-white/40" />
                  <p className="text-sm text-white/50 font-medium">Horarios</p>
                </div>
                {workingHours && workingHours.length > 0 ? (
                  <div className="space-y-1.5">
                    {WEEKDAY_LABELS.map((label, dayIdx) => {
                      const dayHours = workingHours.filter((h) => h.weekday === dayIdx);
                      return (
                        <div key={dayIdx} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                          <span className="text-xs text-white/40 w-20 shrink-0">{label}</span>
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {dayHours.length === 0 ? (
                              <span className="text-xs text-white/15">Sin horario</span>
                            ) : (
                              dayHours.map((h, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleToggleWorkingHour(h)}
                                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                    h.is_active
                                      ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                                      : 'bg-white/[0.04] text-white/20 border border-white/[0.06] line-through'
                                  }`}
                                >
                                  {h.start_time.slice(0, 5)}-{h.end_time.slice(0, 5)}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-white/20">Sin horarios configurados</p>
                )}
              </div>

              {/* Listings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/50">Servicios ({detail.listings.length})</p>
                  <button
                    onClick={() => setShowListingForm(true)}
                    className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>
                {detail.listings.length > 0 && (
                  <div className="space-y-1.5">
                    {detail.listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                      >
                        <div>
                          <p className="text-sm text-white/70">{listing.title}</p>
                          <p className="text-xs text-white/25">{listing.service__name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-white/60">${listing.base_price}</p>
                            <p className="text-[10px] text-white/25">{listing.price_unit}</p>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este servicio?')) {
                                deleteListing.mutate(listing.id, {
                                  onSuccess: () => toast.success('Servicio eliminado'),
                                  onError: () => toast.error('Error al eliminar'),
                                });
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-red-400 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Listing create form */}
              {showListingForm && (
                <ListingCreateForm
                  providerId={selectedId}
                  services={services || []}
                  createListing={createListing}
                  onClose={() => setShowListingForm(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create provider modal */}
      {showCreateModal && (
        <CreateProviderModal
          categories={categories || []}
          onClose={() => { setShowCreateModal(false); setGeneratedPassword(null); }}
          onCreated={(password) => setGeneratedPassword(password)}
          generatedPassword={generatedPassword}
          createProvider={createProvider}
        />
      )}
    </div>
  );
}


function CreateProviderModal({
  categories,
  onClose,
  onCreated,
  generatedPassword,
  createProvider,
}: {
  categories: { id: number; name: string }[];
  onClose: () => void;
  onCreated: (password: string) => void;
  generatedPassword: string | null;
  createProvider: ReturnType<typeof useAdminCreateProvider>;
}) {
  const [form, setForm] = useState<AdminProviderCreateData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    price_band: 'standard',
    category_ids: [],
    location_lat: -33.4489,
    location_lng: -70.6693,
    radius_km: 15,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProvider.mutate(form, {
      onSuccess: (data) => {
        toast.success('Proveedor creado exitosamente');
        onCreated(data.generated_password);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Error al crear proveedor');
      },
    });
  };

  const toggleCategory = (id: number) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids?.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...(prev.category_ids || []), id],
    }));
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('Contrasena copiada');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-900 border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">
            {generatedPassword ? 'Proveedor Creado' : 'Agregar Proveedor'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.1]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generatedPassword ? (
          <div className="p-5 space-y-4">
            <p className="text-sm text-white/60">
              El proveedor fue creado exitosamente. Envia esta contrasena al proveedor para que pueda acceder a su cuenta:
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <code className="text-accent-400 text-sm font-mono flex-1">{generatedPassword}</code>
              <button
                onClick={copyPassword}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.1]"
                title="Copiar"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/30">
              Esta contrasena solo se muestra una vez. Asegurate de copiarla antes de cerrar.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-accent-500 text-brand-900 rounded-xl text-sm font-medium hover:bg-accent-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Nombre *</label>
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Apellido *</label>
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Telefono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50 placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Rango de precio</label>
              <div className="flex gap-2">
                {['budget', 'standard', 'premium', 'luxury'].map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setForm({ ...form, price_band: band })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.price_band === band
                        ? 'bg-accent-500 text-brand-900'
                        : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                    }`}
                  >
                    {PRICE_LABELS[band]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1 block">Categorias</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const selected = form.category_ids?.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                          : 'bg-white/[0.04] text-white/30 border border-transparent hover:bg-white/[0.08]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={form.location_lat ?? ''}
                  onChange={(e) => setForm({ ...form, location_lat: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={form.location_lng ?? ''}
                  onChange={(e) => setForm({ ...form, location_lng: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Radio (km)</label>
                <input
                  type="number"
                  step="any"
                  value={form.radius_km ?? 15}
                  onChange={(e) => setForm({ ...form, radius_km: parseFloat(e.target.value) || 15 })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:border-accent-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createProvider.isPending}
              className="w-full py-2.5 bg-accent-500 text-brand-900 rounded-xl text-sm font-medium hover:bg-accent-400 transition-colors disabled:opacity-50"
            >
              {createProvider.isPending ? 'Creando...' : 'Crear Proveedor'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


function ListingCreateForm({
  providerId,
  services,
  createListing,
  onClose,
}: {
  providerId: number;
  services: { id: number; name: string; category_name: string }[];
  createListing: ReturnType<typeof useAdminCreateListing>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    service_id: '',
    title: '',
    description: '',
    base_price: '',
    price_unit: 'fixed',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_id || !form.title || !form.base_price) {
      toast.error('Completa los campos requeridos');
      return;
    }
    createListing.mutate(
      {
        provider_id: providerId,
        service_id: parseInt(form.service_id),
        title: form.title,
        description: form.description,
        base_price: form.base_price,
        price_unit: form.price_unit,
        is_active: form.is_active,
      },
      {
        onSuccess: () => {
          toast.success('Servicio creado');
          onClose();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al crear'),
      }
    );
  };

  return (
    <div className="border border-accent-500/20 rounded-xl p-4 bg-accent-500/5 space-y-3">
      <p className="text-sm font-medium text-accent-400">Nuevo Servicio</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          value={form.service_id}
          onChange={(e) => setForm({ ...form, service_id: e.target.value })}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 focus:outline-none"
        >
          <option value="">Tipo de servicio...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.category_name})</option>
          ))}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Titulo"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 focus:outline-none placeholder:text-white/20"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripcion"
          rows={2}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 focus:outline-none resize-none placeholder:text-white/20"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            placeholder="Precio"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 focus:outline-none placeholder:text-white/20"
          />
          <select
            value={form.price_unit}
            onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm px-3 py-2 focus:outline-none"
          >
            <option value="fixed">Precio fijo</option>
            <option value="hourly">Por hora</option>
            <option value="daily">Por dia</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createListing.isPending}
            className="flex-1 bg-accent-500 text-brand-900 py-2 rounded-lg text-sm font-medium hover:bg-accent-400 transition-colors disabled:opacity-50"
          >
            {createListing.isPending ? 'Creando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
