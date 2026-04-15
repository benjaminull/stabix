'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useProviderDashboard } from '@/lib/api/hooks/useProviderDashboard';
import {
  useProviderMatches,
  useAcceptMatch,
  useRejectMatch,
} from '@/lib/api/hooks/useProviderMatches';
import {
  useProviderOrders,
  useUpdateOrderStatus,
} from '@/lib/api/hooks/useProviderOrders';
import {
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointmentStatus,
} from '@/lib/api/hooks/useAppointments';
import type { Appointment } from '@/lib/api/hooks/useAppointments';
import {
  WhatsAppButton,
  generateWhatsAppMessage,
} from '@/components/common/WhatsAppButton';
import {
  Plus,
  Clock,
  Star,
  CheckCircle,
  X,
  Trash2,
  Edit,
  TrendingUp,
  AlertCircle,
  Check,
  DollarSign,
  Calendar,
  ShoppingBag,
  PlayCircle,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const WeeklyCalendar = dynamic(
  () => import('@/components/provider/calendar/WeeklyCalendar'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-accent-500 rounded-full animate-spin" />
      </div>
    ),
  }
);

type FormData = {
  type: 'external' | 'personal';
  client_name: string;
  client_phone: string;
  service_description: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  type: 'external',
  client_name: '',
  client_phone: '',
  service_description: '',
  date: '',
  start_time: '09:00',
  end_time: '10:00',
  notes: '',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  created: { label: 'Creada', color: 'text-blue-400', dot: 'bg-blue-400' },
  paid: { label: 'Pagada', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  in_progress: { label: 'En Progreso', color: 'text-amber-400', dot: 'bg-amber-400' },
  completed: { label: 'Completada', color: 'text-violet-400', dot: 'bg-violet-400' },
  cancelled: { label: 'Cancelada', color: 'text-red-400', dot: 'bg-red-400' },
};

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  created: [{ value: 'paid', label: 'Marcar Pagada' }],
  paid: [{ value: 'in_progress', label: 'Iniciar Trabajo' }, { value: 'cancelled', label: 'Cancelar' }],
  in_progress: [{ value: 'completed', label: 'Completar' }, { value: 'cancelled', label: 'Cancelar' }],
};

export default function ProviderDashboardPage() {
  const { data: dashData, isLoading: dashLoading } = useProviderDashboard();
  const { data: pendingMatches } = useProviderMatches('pending');
  const { data: activeOrders } = useProviderOrders('');
  const acceptMatch = useAcceptMatch();
  const rejectMatch = useRejectMatch();
  const updateOrderStatus = useUpdateOrderStatus();
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const updateAppointmentStatus = useUpdateAppointmentStatus();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeSection, setActiveSection] = useState<'calendar' | 'requests' | 'orders'>('calendar');

  // Match accept dialog
  const [acceptingMatch, setAcceptingMatch] = useState<any>(null);
  const [quoteData, setQuoteData] = useState({ price_quote: '', eta_minutes: '', provider_notes: '' });

  const openForm = (prefill?: Partial<FormData>) => {
    setForm({ ...EMPTY_FORM, ...prefill });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); };

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    openForm({
      date: format(slotInfo.start, 'yyyy-MM-dd'),
      start_time: format(slotInfo.start, 'HH:mm'),
      end_time: format(slotInfo.end, 'HH:mm'),
    });
  };

  const handleSubmit = async () => {
    if (form.type === 'external' && !form.client_name.trim()) {
      toast.error('Ingresa el nombre del cliente'); return;
    }
    if (!form.date || !form.start_time || !form.end_time) {
      toast.error('Completa fecha y hora'); return;
    }
    const start_datetime = `${form.date}T${form.start_time}:00`;
    const end_datetime = `${form.date}T${form.end_time}:00`;
    if (end_datetime <= start_datetime) {
      toast.error('La hora de fin debe ser después del inicio'); return;
    }
    try {
      await createAppointment.mutateAsync({
        appointment_type: form.type,
        client_name: form.type === 'external' ? form.client_name : undefined,
        client_phone: form.type === 'external' ? form.client_phone : undefined,
        service_description: form.type === 'external' ? form.service_description : undefined,
        start_datetime, end_datetime,
        notes: form.notes || undefined,
      });
      toast.success('Cita creada');
      closeForm();
    } catch { toast.error('Error al crear la cita'); }
  };

  const handleAcceptMatch = async () => {
    if (!acceptingMatch) return;
    try {
      await acceptMatch.mutateAsync({
        id: acceptingMatch.id,
        data: {
          price_quote: quoteData.price_quote || undefined,
          eta_minutes: quoteData.eta_minutes ? parseInt(quoteData.eta_minutes) : undefined,
          provider_notes: quoteData.provider_notes || undefined,
        },
      });
      toast.success('Solicitud aceptada');
      setAcceptingMatch(null);
      setQuoteData({ price_quote: '', eta_minutes: '', provider_notes: '' });
    } catch { toast.error('Error al aceptar'); }
  };

  const handleRejectMatch = async (id: number) => {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    try {
      await rejectMatch.mutateAsync(id);
      toast.success('Solicitud rechazada');
    } catch { toast.error('Error al rechazar'); }
  };

  const handleUpdateOrder = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, new_status: newStatus });
      toast.success('Estado actualizado');
    } catch { toast.error('Error al actualizar'); }
  };

  const set = (key: keyof FormData, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const stats = dashData?.stats;
  const matches = pendingMatches?.results || [];
  const orders = (activeOrders?.results || []).filter((o: any) => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {!dashLoading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: AlertCircle, label: 'Solicitudes', value: matches.length, accent: matches.length > 0 ? 'text-amber-400' : 'text-white/30' },
            { icon: Clock, label: 'En progreso', value: stats.in_progress_orders || 0, accent: 'text-accent-500' },
            { icon: Star, label: 'Rating', value: stats.average_rating ? stats.average_rating.toFixed(1) : '—', accent: 'text-amber-400' },
            { icon: TrendingUp, label: 'Este mes', value: `$${(stats.recent_revenue || 0).toLocaleString()}`, accent: 'text-emerald-400' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="group bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl px-4 py-3.5 border border-white/[0.04] transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center ${accent} transition-colors`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white leading-none">{value}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 font-medium">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section tabs (mobile) + Calendar */}
      <div className="space-y-4">
        {/* Sub-navigation for mobile */}
        <div className="flex items-center gap-2 md:hidden overflow-x-auto pb-1">
          {[
            { id: 'calendar' as const, label: 'Calendario', count: 0 },
            { id: 'requests' as const, label: 'Solicitudes', count: matches.length },
            { id: 'orders' as const, label: 'Órdenes', count: orders.length },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${activeSection === sec.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/60'
                }
              `}
            >
              {sec.label}
              {sec.count > 0 && (
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                  activeSection === sec.id ? 'bg-accent-500 text-brand-900' : 'bg-white/10 text-white/50'
                }`}>
                  {sec.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          {/* Calendar column */}
          <div className={`space-y-4 ${activeSection !== 'calendar' ? 'hidden md:block' : ''}`}>
            {/* Calendar header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Calendario</h2>
              <button
                onClick={() => openForm({ date: format(new Date(), 'yyyy-MM-dd') })}
                className="flex items-center gap-2 bg-accent-500 text-brand-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent-400 transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/20"
              >
                <Plus className="w-4 h-4" />
                Nueva cita
              </button>
            </div>

            {/* Calendar card */}
            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
              <WeeklyCalendar
                onSelectEvent={(event) => setSelectedAppointment(event.resource)}
                onSelectSlot={handleSlotSelect}
              />
              <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/[0.04] text-xs text-white/35">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Plataforma</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-500" />Externo</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />Personal</span>
              </div>
            </div>
          </div>

          {/* Right column: Requests + Orders */}
          <div className="space-y-5">
            {/* Pending matches */}
            <div className={`${activeSection !== 'requests' ? 'hidden md:block' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  Solicitudes
                  {matches.length > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                      {matches.length}
                    </span>
                  )}
                </h2>
              </div>

              {matches.length === 0 ? (
                <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-6 text-center">
                  <p className="text-sm text-white/30">Sin solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {matches.slice(0, 5).map((match: any) => {
                    const job = match.job_request_details;
                    const service = job?.service_details;
                    return (
                      <div key={match.id} className="bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl border border-white/[0.04] p-4 transition-all duration-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{service?.name || 'Servicio'}</p>
                            <p className="text-xs text-white/35 mt-0.5">
                              {formatDistanceToNow(new Date(match.created_at), { addSuffix: true, locale: es })}
                              {job?.budget_estimate && ` · $${job.budget_estimate}`}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-lg">
                            {match.score.toFixed(0)}%
                          </span>
                        </div>
                        {job?.details && (
                          <p className="text-xs text-white/40 mb-3 line-clamp-2">{job.details}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAcceptingMatch(match)}
                            disabled={acceptMatch.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleRejectMatch(match.id)}
                            disabled={rejectMatch.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] text-white/40 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active orders */}
            <div className={`${activeSection !== 'orders' ? 'hidden md:block' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  Órdenes activas
                  {orders.length > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent-500/20 text-accent-400 text-[10px] font-bold">
                      {orders.length}
                    </span>
                  )}
                </h2>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white/[0.02] rounded-2xl border border-white/[0.04] p-6 text-center">
                  <p className="text-sm text-white/30">Sin órdenes activas</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {orders.slice(0, 6).map((order: any) => {
                    const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.created;
                    const nextOpts = NEXT_STATUS[order.status] || [];
                    return (
                      <div key={order.id} className="bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl border border-white/[0.04] p-4 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                            <p className="text-sm font-medium text-white">Orden #{order.id}</p>
                          </div>
                          <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/35 mb-3">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />${order.amount}
                          </span>
                          {order.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(order.scheduled_at), "d MMM, HH:mm", { locale: es })}
                            </span>
                          )}
                        </div>
                        {nextOpts.length > 0 && (
                          <div className="flex gap-2">
                            {nextOpts.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleUpdateOrder(order.id, opt.value)}
                                disabled={updateOrderStatus.isPending}
                                className={`
                                  flex-1 py-2 rounded-xl text-xs font-semibold transition-colors
                                  ${opt.value === 'cancelled'
                                    ? 'bg-white/[0.04] text-white/40 hover:bg-red-500/10 hover:text-red-400'
                                    : 'bg-accent-500/15 text-accent-400 hover:bg-accent-500/25'
                                  }
                                `}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAppointment(null)}>
          <div className="bg-brand-800 rounded-2xl w-full max-w-md border border-white/[0.08] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Color bar */}
            <div className={`h-1 ${
              selectedAppointment.appointment_type === 'order' ? 'bg-emerald-500' :
              selectedAppointment.appointment_type === 'external' ? 'bg-accent-500' : 'bg-slate-500'
            }`} />

            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold text-white">
                {selectedAppointment.appointment_type === 'order' ? 'Cita de Plataforma' :
                 selectedAppointment.appointment_type === 'external' ? 'Cita Externa' : 'Bloqueo Personal'}
              </h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pb-4 space-y-3">
              {selectedAppointment.client_name && (
                <DetailRow label="Cliente" value={selectedAppointment.client_name} />
              )}
              {selectedAppointment.client_phone && (
                <DetailRow label="Teléfono" value={selectedAppointment.client_phone} />
              )}
              {selectedAppointment.service_description && (
                <DetailRow label="Servicio" value={selectedAppointment.service_description} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Inicio" value={format(new Date(selectedAppointment.start_datetime), 'dd/MM HH:mm')} />
                <DetailRow label="Fin" value={format(new Date(selectedAppointment.end_datetime), 'dd/MM HH:mm')} />
              </div>
              <DetailRow label="Estado" value={selectedAppointment.status_display || selectedAppointment.status} />
              {selectedAppointment.notes && <DetailRow label="Notas" value={selectedAppointment.notes} />}
              {selectedAppointment.order_details && (
                <DetailRow label="Orden" value={`#${selectedAppointment.order_details.id} · $${selectedAppointment.order_details.amount}`} />
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2">
              {selectedAppointment.appointment_type !== 'order' && (
                <>
                  <button
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      openForm({
                        type: apt.appointment_type as 'external' | 'personal',
                        client_name: apt.client_name || '', client_phone: apt.client_phone || '',
                        service_description: apt.service_description || '',
                        date: format(new Date(apt.start_datetime), 'yyyy-MM-dd'),
                        start_time: format(new Date(apt.start_datetime), 'HH:mm'),
                        end_time: format(new Date(apt.end_datetime), 'HH:mm'),
                        notes: apt.notes || '',
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <Edit className="w-4 h-4" />Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar esta cita?')) return;
                      try { await deleteAppointment.mutateAsync(selectedAppointment.id); toast.success('Eliminada'); setSelectedAppointment(null); }
                      catch { toast.error('Error'); }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />Eliminar
                  </button>
                </>
              )}
              {selectedAppointment.appointment_type === 'order' && selectedAppointment.status === 'scheduled' && (
                <button
                  onClick={async () => {
                    try { await updateAppointmentStatus.mutateAsync({ id: selectedAppointment.id, status: 'confirmed' }); toast.success('Confirmada'); setSelectedAppointment(null); }
                    catch { toast.error('Error'); }
                  }}
                  className="flex-1 bg-accent-500 text-brand-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-400 transition-colors"
                >
                  Confirmar Cita
                </button>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div className="bg-brand-800 rounded-2xl w-full max-w-md border border-white/[0.08] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold text-white">Nueva cita</h3>
              <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-4 space-y-4">
              <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
                {(['external', 'personal'] as const).map((t) => (
                  <button
                    key={t} type="button" onClick={() => set('type', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.type === t ? 'bg-accent-500 text-brand-900 shadow-sm' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {t === 'external' ? 'Cliente externo' : 'Personal'}
                  </button>
                ))}
              </div>
              {form.type === 'external' && (
                <div className="space-y-3">
                  <ModalInput placeholder="Nombre del cliente *" value={form.client_name} onChange={(v) => set('client_name', v)} />
                  <ModalInput placeholder="Teléfono (opcional)" value={form.client_phone} onChange={(v) => set('client_phone', v)} type="tel" />
                  <ModalInput placeholder="Servicio (ej: Reparación lavadora)" value={form.service_description} onChange={(v) => set('service_description', v)} />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1 block">Fecha</label>
                  <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1 block">Inicio</label>
                  <input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/25 font-medium tracking-wider mb-1 block">Fin</label>
                  <input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark]" />
                </div>
              </div>
              <textarea placeholder="Notas (opcional)" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-500/50 resize-none" />
            </div>
            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2">
              <button onClick={closeForm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={createAppointment.isPending}
                className="flex-1 bg-accent-500 text-brand-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-400 transition-all disabled:opacity-50">
                {createAppointment.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Match Modal */}
      {acceptingMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setAcceptingMatch(null)}>
          <div className="bg-brand-800 rounded-2xl w-full max-w-md border border-white/[0.08] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 bg-emerald-500" />
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold text-white">Aceptar Solicitud</h3>
              <button onClick={() => setAcceptingMatch(null)} className="text-white/30 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-4 space-y-3">
              <p className="text-xs text-white/40">Datos opcionales para el cliente</p>
              <ModalInput placeholder="Tu cotización ($)" value={quoteData.price_quote} onChange={(v) => setQuoteData({ ...quoteData, price_quote: v })} type="number" />
              <ModalInput placeholder="Tiempo estimado (min)" value={quoteData.eta_minutes} onChange={(v) => setQuoteData({ ...quoteData, eta_minutes: v })} type="number" />
              <textarea placeholder="Notas adicionales..." value={quoteData.provider_notes} onChange={(e) => setQuoteData({ ...quoteData, provider_notes: e.target.value })} rows={2}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-500/50 resize-none" />
            </div>
            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2">
              <button onClick={() => setAcceptingMatch(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors">
                Cancelar
              </button>
              <button onClick={handleAcceptMatch} disabled={acceptMatch.isPending}
                className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50">
                {acceptMatch.isPending ? 'Aceptando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small helpers to keep the JSX cleaner */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-white/25 font-medium tracking-wider">{label}</p>
      <p className="text-white text-sm mt-0.5">{value}</p>
    </div>
  );
}

function ModalInput({ placeholder, value, onChange, type = 'text' }: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-500/50" />
  );
}
