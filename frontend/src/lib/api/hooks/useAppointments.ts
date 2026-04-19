/**
 * React Query hooks for appointments/calendar
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

function toQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// Types
export interface WorkingHours {
  id: number;
  weekday: number;
  weekday_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  provider: number;
  appointment_type: "order" | "external" | "personal";
  appointment_type_display: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  status_display: string;
  order: number | null;
  order_details: {
    id: number;
    amount: string;
    status: string;
    job_request_id: number;
  } | null;
  client_name: string;
  client_phone: string;
  client_info: {
    name: string;
    email?: string;
    phone?: string;
  };
  service_description: string;
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlotProposal {
  id: number;
  job_request: number;
  job_request_details: {
    id: number;
    service: string | null;
    description: string;
    estimated_budget: string;
  };
  provider: number;
  customer_info: {
    id: number;
    name: string;
    email: string;
  };
  proposed_datetime_1: string;
  proposed_datetime_2: string | null;
  proposed_datetime_3: string | null;
  proposed_slots: string[];
  duration_minutes: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  status_display: string;
  selected_datetime: string | null;
  provider_notes: string;
  responded_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarViewData {
  start_date: string;
  end_date: string;
  appointments_by_date: Record<string, Appointment[]>;
  total_appointments: number;
}

// Working Hours Hooks
export function useWorkingHours() {
  return useQuery({
    queryKey: ["working-hours"],
    queryFn: () =>
      apiClient.get<WorkingHours[]>("/v1/provider/calendar/working-hours/", { auth: true }),
  });
}

export function useCreateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      weekday: number;
      start_time: string;
      end_time: string;
      is_active?: boolean;
    }) =>
      apiClient.post<WorkingHours>("/v1/provider/calendar/working-hours/", data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-hours"] });
    },
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkingHours> }) =>
      apiClient.patch<WorkingHours>(`/v1/provider/calendar/working-hours/${id}/`, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-hours"] });
    },
  });
}

export function useDeleteWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/v1/provider/calendar/working-hours/${id}/`, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["working-hours"] });
    },
  });
}

// Appointments Hooks
export function useAppointments(params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () =>
      apiClient.get<Appointment[]>(
        `/v1/provider/calendar/appointments/${toQueryString(params)}`,
        { auth: true }
      ),
  });
}

export function useCalendarView(params: {
  start_date: string;
  end_date: string;
}) {
  return useQuery({
    queryKey: ["calendar-view", params],
    queryFn: () =>
      apiClient.get<CalendarViewData>(
        `/v1/provider/calendar/appointments/calendar_view/${toQueryString(params)}`,
        { auth: true }
      ),
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: () =>
      apiClient.get<Appointment>(`/v1/provider/calendar/appointments/${id}/`, { auth: true }),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      appointment_type: "external" | "personal";
      client_name?: string;
      client_phone?: string;
      service_description?: string;
      start_datetime: string;
      end_datetime: string;
      notes?: string;
    }) =>
      apiClient.post<Appointment>("/v1/provider/calendar/appointments/", data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-view"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Appointment> }) =>
      apiClient.patch<Appointment>(`/v1/provider/calendar/appointments/${id}/`, data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-view"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.post<Appointment>(
        `/v1/provider/calendar/appointments/${id}/update_status/`,
        { status },
        { auth: true }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-view"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/v1/provider/calendar/appointments/${id}/`, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-view"] });
    },
  });
}

// Time Slot Proposals Hooks
export function useTimeSlotProposals(params?: { status?: string }) {
  return useQuery({
    queryKey: ["time-slot-proposals", params],
    queryFn: () =>
      apiClient.get<TimeSlotProposal[]>(
        `/v1/provider/calendar/proposals/${toQueryString(params)}`,
        { auth: true }
      ),
  });
}

export function usePendingProposals() {
  return useQuery({
    queryKey: ["pending-proposals"],
    queryFn: () =>
      apiClient.get<TimeSlotProposal[]>("/v1/provider/calendar/proposals/pending/", { auth: true }),
  });
}

export function useRespondToProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      selected_datetime,
      provider_notes,
      accept,
    }: {
      id: number;
      selected_datetime: string;
      provider_notes?: string;
      accept?: boolean;
    }) =>
      apiClient.post(
        `/v1/provider/calendar/proposals/${id}/respond/`,
        { selected_datetime, provider_notes, accept },
        { auth: true }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slot-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["pending-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-view"] });
    },
  });
}
