'use client';

import { useState, useEffect } from 'react';
import {
  useProviderListings,
  useCreateListing,
  useUpdateListing,
  useDeleteListing,
} from '@/lib/api/hooks/useProviderListings';
import { useServices } from '@/lib/api/hooks/useTaxonomy';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Check,
  Save,
  X,
  Package,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SLOTS = ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00'];
const SLOT_LABELS = ['Mañana', 'Medio', 'Tarde', 'Noche'];
const PRICE_UNITS: Record<string, string> = { hourly: 'hora', fixed: 'fijo', daily: 'día' };

export default function ProviderBusinessPage() {
  const { data: listingsData, isLoading: listingsLoading } = useProviderListings();
  const { data: servicesData } = useServices();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  // Availability state
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Listing form state
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [listingForm, setListingForm] = useState({
    service: '',
    title: '',
    description: '',
    base_price: '',
    price_unit: 'hourly',
    is_active: true,
  });

  // Active tab for mobile
  const [activeTab, setActiveTab] = useState<'services' | 'availability'>('services');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await apiClient.get<any>(endpoints.provider.me, { auth: true });
      setAvailability(response.availability || {});
    } catch {
      toast.error('Error al cargar disponibilidad');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) => {
      const slots = prev[day] || [];
      return { ...prev, [day]: slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot] };
    });
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    try {
      await apiClient.put(endpoints.provider.availability, { availability }, { auth: true });
      toast.success('Disponibilidad guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSavingAvailability(false);
    }
  };

  const resetListingForm = () => {
    setListingForm({ service: '', title: '', description: '', base_price: '', price_unit: 'hourly', is_active: true });
    setEditingListing(null);
    setShowListingForm(false);
  };

  const handleListingSubmit = async () => {
    if (!listingForm.service || !listingForm.title || !listingForm.base_price) {
      toast.error('Completa los campos requeridos'); return;
    }
    try {
      const payload = {
        service: parseInt(listingForm.service),
        title: listingForm.title,
        description: listingForm.description,
        base_price: listingForm.base_price,
        price_unit: listingForm.price_unit,
        is_active: listingForm.is_active,
      };
      if (editingListing) {
        await updateListing.mutateAsync({ id: editingListing.id, data: payload });
        toast.success('Servicio actualizado');
      } else {
        await createListing.mutateAsync(payload);
        toast.success('Servicio creado');
      }
      resetListingForm();
    } catch { toast.error('Error al guardar'); }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try { await deleteListing.mutateAsync(id); toast.success('Eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const openEditListing = (listing: any) => {
    setEditingListing(listing);
    setListingForm({
      service: listing.service.toString(),
      title: listing.title,
      description: listing.description || '',
      base_price: listing.base_price,
      price_unit: listing.price_unit,
      is_active: listing.is_active,
    });
    setShowListingForm(true);
  };

  const listings = listingsData?.results || [];
  const services = servicesData?.results || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Mi Negocio</h1>
        <p className="text-sm text-white/35 mt-0.5">Configura tus servicios y horarios</p>
      </div>

      {/* Mobile tabs */}
      <div className="flex gap-1 md:hidden bg-white/[0.03] rounded-xl p-1">
        {[
          { id: 'services' as const, label: 'Servicios', count: listings.length },
          { id: 'availability' as const, label: 'Disponibilidad' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id ? 'bg-accent-500 text-brand-900 shadow-sm' : 'text-white/40'
            }`}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'text-brand-900/60' : 'text-white/25'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Services Section ─── */}
        <div className={`space-y-4 ${activeTab !== 'services' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-accent-500" />
              Mis Servicios
            </h2>
            <button
              onClick={() => { resetListingForm(); setShowListingForm(true); }}
              className="flex items-center gap-1.5 bg-accent-500 text-brand-900 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-accent-400 transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>

          {listingsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/[0.03] rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] border-dashed p-8 text-center">
              <Package className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/30 mb-3">No tienes servicios publicados</p>
              <button
                onClick={() => { resetListingForm(); setShowListingForm(true); }}
                className="text-accent-400 text-sm font-medium hover:text-accent-300 transition-colors"
              >
                Crear tu primer servicio
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {listings.map((listing: any) => (
                <div key={listing.id} className="group bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl border border-white/[0.04] p-4 transition-all duration-200">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white truncate">{listing.title}</h3>
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${listing.is_active ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">{listing.service_name}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditListing(listing)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {listing.description && (
                    <p className="text-xs text-white/30 line-clamp-1 mb-2">{listing.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-accent-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="text-sm font-semibold">{Number(listing.base_price).toLocaleString()}</span>
                    <span className="text-xs text-white/30">/ {PRICE_UNITS[listing.price_unit] || listing.price_unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Availability Section ─── */}
        <div className={`space-y-4 ${activeTab !== 'availability' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-500" />
              Disponibilidad
            </h2>
            <button
              onClick={saveAvailability}
              disabled={savingAvailability}
              className="flex items-center gap-1.5 bg-accent-500 text-brand-900 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-accent-400 transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingAvailability ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {availabilityLoading ? (
            <div className="bg-white/[0.03] rounded-2xl h-80 animate-pulse" />
          ) : (
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] overflow-hidden">
              {/* Grid header */}
              <div className="grid grid-cols-[80px_repeat(4,1fr)] border-b border-white/[0.04]">
                <div />
                {SLOT_LABELS.map((label, i) => (
                  <div key={label} className="text-center py-3 border-l border-white/[0.04]">
                    <p className="text-[11px] font-medium text-white/40">{label}</p>
                    <p className="text-[9px] text-white/20 font-mono mt-0.5">{SLOTS[i]}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {DAYS.map((day, di) => {
                const daySlots = availability[day] || [];
                const active = daySlots.length > 0;
                return (
                  <div
                    key={day}
                    className={`grid grid-cols-[80px_repeat(4,1fr)] ${di < DAYS.length - 1 ? 'border-b border-white/[0.03]' : ''} ${active ? 'bg-white/[0.01]' : ''}`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <span className={`text-xs font-medium ${active ? 'text-white' : 'text-white/25'}`}>
                        {day.slice(0, 3)}
                      </span>
                    </div>
                    {SLOTS.map((slot) => {
                      const on = daySlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleSlot(day, slot)}
                          className={`
                            flex items-center justify-center py-3 border-l border-white/[0.04] transition-all duration-150
                            ${on
                              ? 'bg-accent-500/15 text-accent-400'
                              : 'text-white/8 hover:bg-white/[0.03] hover:text-white/15'
                            }
                          `}
                        >
                          {on ? (
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded border border-current opacity-50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-white/20 text-center">
            Toca los bloques donde puedes trabajar
          </p>
        </div>
      </div>

      {/* ─── Listing Form Modal ─── */}
      {showListingForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={resetListingForm}>
          <div className="bg-brand-800 rounded-2xl w-full max-w-md border border-white/[0.08] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 bg-accent-500" />
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold text-white">
                {editingListing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={resetListingForm} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pb-4 space-y-4">
              {/* Service type */}
              <div>
                <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1.5 block">Tipo de servicio</label>
                <select
                  value={listingForm.service}
                  onChange={(e) => setListingForm({ ...listingForm, service: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark] appearance-none"
                >
                  <option value="" className="bg-brand-800">Selecciona...</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id.toString()} className="bg-brand-800">{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1.5 block">Título</label>
                <input
                  type="text" value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  placeholder="Ej: Instalación eléctrica residencial"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1.5 block">Descripción</label>
                <textarea
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  placeholder="Describe tu servicio..."
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-500/50 resize-none"
                />
              </div>

              {/* Price + unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1.5 block">Precio ($)</label>
                  <input
                    type="number" step="0.01" value={listingForm.base_price}
                    onChange={(e) => setListingForm({ ...listingForm, base_price: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1.5 block">Unidad</label>
                  <select
                    value={listingForm.price_unit}
                    onChange={(e) => setListingForm({ ...listingForm, price_unit: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark] appearance-none"
                  >
                    <option value="hourly" className="bg-brand-800">Por hora</option>
                    <option value="fixed" className="bg-brand-800">Precio fijo</option>
                    <option value="daily" className="bg-brand-800">Por día</option>
                  </select>
                </div>
              </div>

              {/* Active toggle */}
              <button
                type="button"
                onClick={() => setListingForm({ ...listingForm, is_active: !listingForm.is_active })}
                className="flex items-center gap-2 text-sm"
              >
                {listingForm.is_active ? (
                  <ToggleRight className="w-6 h-6 text-accent-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-white/30" />
                )}
                <span className={listingForm.is_active ? 'text-white' : 'text-white/40'}>
                  {listingForm.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </button>
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2">
              <button onClick={resetListingForm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleListingSubmit}
                disabled={createListing.isPending || updateListing.isPending}
                className="flex-1 bg-accent-500 text-brand-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-400 transition-all disabled:opacity-50"
              >
                {(createListing.isPending || updateListing.isPending) ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
