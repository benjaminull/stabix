'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProviderScheduleProps {
  providerId: number;
  availability?: Record<string, any>;
  onDateSelect?: (date: Date) => void;
  onSlotSelect?: (slot: string) => void;
  selectedSlot?: string;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ProviderSchedule({
  providerId,
  availability,
  onDateSelect,
  onSlotSelect,
  selectedSlot,
}: ProviderScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const schedule = availability || {};
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const calendarDays = useMemo(() => {
    const first = new Date(currentYear, currentMonth, 1);
    const last = new Date(currentYear, currentMonth + 1, 0);
    const startOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(currentYear, currentMonth, d));
    return days;
  }, [currentMonth, currentYear]);

  const getDayKey = (date: Date) => DAY_KEYS[(date.getDay() + 6) % 7];
  const isAvailable = (date: Date | null) => date ? schedule[getDayKey(date)]?.available !== false : false;
  const isPast = (date: Date | null) => {
    if (!date) return false;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };
  const isSameDay = (a: Date | null, b: Date) => a?.getDate() === b.getDate() && a?.getMonth() === b.getMonth() && a?.getFullYear() === b.getFullYear();

  const slots = (() => {
    const s = schedule[getDayKey(selectedDate)]?.slots || [];
    return s.length > 0 ? s : ['Mañana (9:00 - 13:00)', 'Tarde (14:00 - 18:00)'];
  })();

  const monthLabel = selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-white capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-white/25 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={i} />;
          const past = isPast(date);
          const selected = isSameDay(date, selectedDate);
          const avail = isAvailable(date);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => {
                setSelectedDate(date);
                onDateSelect?.(date);
              }}
              className={`
                aspect-square flex items-center justify-center text-xs rounded-md relative transition-colors
                ${past ? 'text-white/15 cursor-default' : 'cursor-pointer'}
                ${selected ? 'bg-accent-500 text-brand-900 font-semibold' : ''}
                ${!selected && !past ? 'text-white/70 hover:bg-white/5' : ''}
              `}
            >
              {date.getDate()}
              {isToday && !selected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent-500" />
              )}
              {avail && !past && !selected && !isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-green-500/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Slot selection */}
      <div className="pt-3 border-t border-white/6 space-y-2">
        <p className="text-xs text-white/40">
          {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          {isAvailable(selectedDate) && !isPast(selectedDate)
            ? ' — Disponible'
            : isPast(selectedDate) ? '' : ' — No disponible'}
        </p>

        {isAvailable(selectedDate) && !isPast(selectedDate) && (
          <div className="space-y-1.5">
            {slots.map((slot: string) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSlotSelect?.(slot)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors
                  ${selectedSlot === slot
                    ? 'bg-accent-500 text-brand-900 font-medium'
                    : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
                  }
                `}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
