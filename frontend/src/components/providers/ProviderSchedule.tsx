'use client';

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProviderScheduleProps {
  providerId: number;
  availability?: Record<string, any>;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export function ProviderSchedule({ providerId, availability }: ProviderScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Parse availability data
  const schedule = availability || {};

  // Get current month calendar
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = [];
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust for Monday start

  // Add empty cells for days before month starts
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  const isDayAvailable = (date: Date | null) => {
    if (!date) return false;

    const dayOfWeek = date.getDay();
    const dayKey = DAYS_OF_WEEK[(dayOfWeek + 6) % 7].key; // Adjust for Monday start

    // Check if day is available in schedule
    return schedule[dayKey]?.available !== false;
  };

  const getDaySlots = (date: Date | null) => {
    if (!date) return [];

    const dayOfWeek = date.getDay();
    const dayKey = DAYS_OF_WEEK[(dayOfWeek + 6) % 7].key;

    return schedule[dayKey]?.slots || [];
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly < todayOnly;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthName = selectedDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousMonth}
          className="h-8 w-8 p-0"
        >
          ←
        </Button>
        <h3 className="font-semibold text-sm capitalize">{monthName}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
          className="h-8 w-8 p-0"
        >
          →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div
              key={i}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const available = isDayAvailable(date);
            const past = isPastDate(date);
            const todayDate = isToday(date);

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-md
                  ${!date ? 'invisible' : ''}
                  ${available && !past
                    ? 'bg-accent-50 text-accent-900 font-medium cursor-pointer hover:bg-accent-100'
                    : past
                    ? 'text-muted-foreground/40'
                    : 'text-muted-foreground/60'
                  }
                  ${todayDate ? 'ring-2 ring-accent-500' : ''}
                `}
                onClick={() => date && !past && setSelectedDate(date)}
              >
                {date?.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Info */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>

        {isPastDate(selectedDate) ? (
          <p className="text-sm text-muted-foreground">
            Fecha pasada
          </p>
        ) : isDayAvailable(selectedDate) ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Horarios disponibles</span>
            </div>
            {getDaySlots(selectedDate).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {getDaySlots(selectedDate).map((slot: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="justify-center py-1.5 cursor-pointer hover:bg-accent-50"
                  >
                    {slot}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="outline" className="justify-center py-1.5">
                  Mañana (9:00 - 13:00)
                </Badge>
                <Badge variant="outline" className="justify-center py-1.5">
                  Tarde (14:00 - 18:00)
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No disponible en esta fecha
          </p>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">Disponibilidad semanal</h4>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = schedule[day.key];
            const isAvailable = daySchedule?.available !== false;

            return (
              <div
                key={day.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{day.label}</span>
                {isAvailable ? (
                  <Badge variant="secondary" className="text-xs">
                    {daySchedule?.slots?.join(', ') || 'Disponible'}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No disponible
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
