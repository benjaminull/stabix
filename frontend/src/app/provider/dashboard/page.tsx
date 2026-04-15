'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useProviderDashboard } from '@/lib/api/hooks/useProviderDashboard';
import {
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useUpdateAppointmentStatus,
} from '@/lib/api/hooks/useAppointments';
import type { Appointment } from '@/lib/api/hooks/useAppointments';
import { Plus, Clock, Star, CheckCircle, X, Trash2, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const WeeklyCalendar = dynamic(
  () => import('@/components/provider/calendar/WeeklyCalendar'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[650px] flex items-center justify-center">
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

export default function ProviderDashboardPage() {
  const { data, isLoading } = useProviderDashboard();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const openForm = (prefill?: Partial<FormData>) => {
    setForm({ ...EMPTY_FORM, ...prefill });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    openForm({
      date: format(slotInfo.start, 'yyyy-MM-dd'),
      start_time: format(slotInfo.start, 'HH:mm'),
      end_time: format(slotInfo.end, 'HH:mm'),
    });
  };

  const handleSubmit = async () => {
    if (form.type === 'external' && !form.client_name.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    if (!form.date || !form.start_time || !form.end_time) {
      toast.error('Completa fecha y hora');
      return;
    }

    const start_datetime = `${form.date}T${form.start_time}:00`;
    const end_datetime = `${form.date}T${form.end_time}:00`;

    if (end_datetime <= start_datetime) {
      toast.error('La hora de fin debe ser después del inicio');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        appointment_type: form.type,
        client_name: form.type === 'external' ? form.client_name : undefined,
        client_phone: form.type === 'external' ? form.client_phone : undefined,
        service_description: form.type === 'external' ? form.service_description : undefined,
        start_datetime,
        end_datetime,
        notes: form.notes || undefined,
      });
      toast.success('Cita creada');
      closeForm();
    } catch {
      toast.error('Error al crear la cita');
    }
  };

  const set = (key: keyof FormData, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Mi Agenda</h1>
          <p className="text-sm text-white/40 mt-0.5">Gestiona tus citas y servicios</p>
        </div>
        <button
          onClick={() => openForm({ date: format(new Date(), 'yyyy-MM-dd') })}
          className="flex items-center gap-2 bg-accent-500 text-brand-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>

      {/* Stats */}
      {!isLoading && data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.04] rounded-lg px-4 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent-500 shrink-0" />
            <div>
              <p className="text-2xl font-semibold text-white leading-none">{data.stats.in_progress_orders || 0}</p>
              <p className="text-xs text-white/40 mt-0.5">Pendientes</p>
            </div>
          </div>
          <div className="bg-white/[0.04] rounded-lg px-4 py-3 flex items-center gap-3">
            <Star className="w-5 h-5 text-accent-400 shrink-0" />
            <div>
              <p className="text-2xl font-semibold text-white leading-none">
                {data.stats.average_rating ? data.stats.average_rating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-white/40 mt-0.5">Rating</p>
            </div>
          </div>
          <div className="bg-white/[0.04] rounded-lg px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-2xl font-semibold text-white leading-none">{data.stats.completed_orders || 0}</p>
              <p className="text-xs text-white/40 mt-0.5">Completados</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
        <WeeklyCalendar
          onSelectEvent={(event) => setSelectedAppointment(event.resource)}
          onSelectSlot={handleSlotSelect}
        />
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/40">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green-500" />Plataforma</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-accent-500" />Externo</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-500" />Personal</span>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAppointment(null)}>
          <div
            className="bg-brand-800 rounded-xl w-full max-w-md border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">
                {selectedAppointment.appointment_type === 'order' ? 'Cita de Plataforma' :
                 selectedAppointment.appointment_type === 'external' ? 'Cita Externa' : 'Bloqueo Personal'}
              </h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {selectedAppointment.client_name && (
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Cliente</p>
                  <p className="text-white text-sm">{selectedAppointment.client_name}</p>
                </div>
              )}
              {selectedAppointment.client_phone && (
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Teléfono</p>
                  <p className="text-white text-sm">{selectedAppointment.client_phone}</p>
                </div>
              )}
              {selectedAppointment.service_description && (
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Servicio</p>
                  <p className="text-white text-sm">{selectedAppointment.service_description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Inicio</p>
                  <p className="text-white text-sm">{format(new Date(selectedAppointment.start_datetime), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Fin</p>
                  <p className="text-white text-sm">{format(new Date(selectedAppointment.end_datetime), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Estado</p>
                <p className="text-white text-sm">{selectedAppointment.status_display || selectedAppointment.status}</p>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Notas</p>
                  <p className="text-white text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
              {selectedAppointment.order_details && (
                <div>
                  <p className="text-[10px] uppercase text-white/30 font-medium tracking-wide">Orden</p>
                  <p className="text-white text-sm">#{selectedAppointment.order_details.id} · ${selectedAppointment.order_details.amount}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/5 flex gap-2">
              {selectedAppointment.appointment_type !== 'order' && (
                <>
                  <button
                    onClick={() => {
                      const apt = selectedAppointment;
                      setSelectedAppointment(null);
                      openForm({
                        type: apt.appointment_type as 'external' | 'personal',
                        client_name: apt.client_name || '',
                        client_phone: apt.client_phone || '',
                        service_description: apt.service_description || '',
                        date: format(new Date(apt.start_datetime), 'yyyy-MM-dd'),
                        start_time: format(new Date(apt.start_datetime), 'HH:mm'),
                        end_time: format(new Date(apt.end_datetime), 'HH:mm'),
                        notes: apt.notes || '',
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('¿Eliminar esta cita?')) return;
                      try {
                        await deleteAppointment.mutateAsync(selectedAppointment.id);
                        toast.success('Cita eliminada');
                        setSelectedAppointment(null);
                      } catch {
                        toast.error('Error al eliminar');
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </>
              )}
              {selectedAppointment.appointment_type === 'order' && selectedAppointment.status === 'scheduled' && (
                <button
                  onClick={async () => {
                    try {
                      await updateStatus.mutateAsync({ id: selectedAppointment.id, status: 'confirmed' });
                      toast.success('Cita confirmada');
                      setSelectedAppointment(null);
                    } catch {
                      toast.error('Error al confirmar');
                    }
                  }}
                  className="flex-1 bg-accent-500 text-brand-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-400 transition-colors"
                >
                  Confirmar Cita
                </button>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div
            className="bg-brand-800 rounded-xl w-full max-w-md border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Nueva cita</h3>
              <button onClick={closeForm} className="text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1">
                {(['external', 'personal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                      form.type === t
                        ? 'bg-accent-500 text-brand-900'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {t === 'external' ? 'Cliente externo' : 'Personal'}
                  </button>
                ))}
              </div>

              {/* Client fields - only for external */}
              {form.type === 'external' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre del cliente *"
                    value={form.client_name}
                    onChange={(e) => set('client_name', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-500/50"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    value={form.client_phone}
                    onChange={(e) => set('client_phone', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-500/50"
                  />
                  <input
                    type="text"
                    placeholder="Servicio (ej: Reparación lavadora)"
                    value={form.service_description}
                    onChange={(e) => set('service_description', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-500/50"
                  />
                </div>
              )}

              {/* Date & time */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <label className="text-[10px] uppercase text-white/30 font-medium tracking-wide mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/30 font-medium tracking-wide mb-1 block">Inicio</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => set('start_time', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/30 font-medium tracking-wide mb-1 block">Fin</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => set('end_time', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Notes */}
              <textarea
                placeholder="Notas (opcional)"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-500/50 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/5 flex gap-2">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={createAppointment.isPending}
                className="flex-1 bg-accent-500 text-brand-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-400 transition-colors disabled:opacity-50"
              >
                {createAppointment.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
