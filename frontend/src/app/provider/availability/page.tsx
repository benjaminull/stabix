'use client';

import { useState, useEffect } from 'react';
import { Check, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SLOTS = ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00'];
const SLOT_LABELS = ['Mañana', 'Medio', 'Tarde', 'Noche'];

export default function ProviderAvailabilityPage() {
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await apiClient.get<any>(endpoints.provider.me, { auth: true });
      setAvailability(response.availability || {});
    } catch (error) {
      toast.error('Error al cargar disponibilidad');
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = (day: string, slot: string) => {
    setAvailability((prev) => {
      const slots = prev[day] || [];
      return {
        ...prev,
        [day]: slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot],
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(endpoints.provider.availability, { availability }, { auth: true });
      toast.success('Guardado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-white/20 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Disponibilidad</h1>
          <p className="text-sm text-white/40 mt-0.5">Toca los bloques donde puedes trabajar</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-accent-500 text-brand-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-400 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white/[0.03] rounded-xl border border-white/6 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(4,1fr)] border-b border-white/6">
          <div />
          {SLOT_LABELS.map((label, i) => (
            <div key={label} className="text-center py-3 border-l border-white/6">
              <p className="text-xs font-medium text-white/50">{label}</p>
              <p className="text-[10px] text-white/25 font-mono mt-0.5">{SLOTS[i]}</p>
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
              className={`grid grid-cols-[100px_repeat(4,1fr)] ${di < DAYS.length - 1 ? 'border-b border-white/4' : ''}`}
            >
              <div className="flex items-center px-4 py-3">
                <span className={`text-sm ${active ? 'text-white font-medium' : 'text-white/30'}`}>
                  {day.slice(0, 3)}
                </span>
              </div>
              {SLOTS.map((slot) => {
                const on = daySlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggle(day, slot)}
                    className={`
                      flex items-center justify-center py-3 border-l border-white/6 transition-colors
                      ${on
                        ? 'bg-accent-500/15 text-accent-500'
                        : 'text-white/10 hover:bg-white/[0.03] hover:text-white/20'
                      }
                    `}
                  >
                    {on ? (
                      <Check className="w-5 h-5" strokeWidth={2.5} />
                    ) : (
                      <div className="w-4 h-4 rounded border border-current" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
