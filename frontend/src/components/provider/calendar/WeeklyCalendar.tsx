"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { useCalendarView } from "@/lib/api/hooks/useAppointments";
import type { Appointment } from "@/lib/api/hooks/useAppointments";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: "Todo el día",
  previous: "Ant",
  next: "Sig",
  today: "Hoy",
  week: "Semana",
  day: "Día",
  agenda: "Lista",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Sin citas en este período",
  showMore: (total: number) => `+${total}`,
};

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

interface WeeklyCalendarProps {
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

// Simple, solid, high-contrast colors
const EVENT_COLORS: Record<string, string> = {
  order: "#22c55e",
  external: "#FF8C42",
  personal: "#64748b",
  cancelled: "#ef4444",
  completed: "#a78bfa",
};

export default function WeeklyCalendar({
  onSelectEvent,
  onSelectSlot,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("week");

  const dateRange = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return {
      start_date: format(startOfDay(start), "yyyy-MM-dd"),
      end_date: format(endOfDay(end), "yyyy-MM-dd"),
    };
  }, [currentDate]);

  const { data: calendarData, isLoading } = useCalendarView(dateRange);

  const events: CalendarEvent[] = useMemo(() => {
    if (!calendarData?.appointments_by_date) return [];
    const all: CalendarEvent[] = [];
    Object.values(calendarData.appointments_by_date).forEach((appointments) => {
      (appointments as Appointment[]).forEach((apt: Appointment) => {
        all.push({
          id: apt.id,
          title: getTitle(apt),
          start: new Date(apt.start_datetime),
          end: new Date(apt.end_datetime),
          resource: apt,
        });
      });
    });
    return all;
  }, [calendarData]);

  const getTitle = (apt: Appointment): string => {
    if (apt.appointment_type === "order" && apt.order_details) {
      return `${apt.client_info.name} · $${apt.order_details.amount}`;
    }
    if (apt.appointment_type === "external") {
      return `${apt.client_name} · ${apt.service_description.slice(0, 25)}`;
    }
    return apt.notes || "Personal";
  };

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { appointment_type, status } = event.resource;
    const done = status === "cancelled" || status === "completed";
    const color = EVENT_COLORS[done ? status : appointment_type] || EVENT_COLORS.order;

    return {
      style: {
        backgroundColor: color,
        borderRadius: "4px",
        opacity: done ? 0.5 : 1,
        color: "#fff",
        border: "none",
        fontSize: "0.75rem",
        fontWeight: 500,
        padding: "2px 6px",
        lineHeight: "1.4",
      },
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[650px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        view={view}
        onView={setView}
        onNavigate={setCurrentDate}
        date={currentDate}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        step={30}
        timeslots={2}
        views={["week", "day", "agenda"]}
        culture="es"
        messages={messages}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 22, 0, 0)}
        scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
      />
    </div>
  );
}
