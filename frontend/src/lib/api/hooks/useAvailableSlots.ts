import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export interface AvailableSlot {
  start: string;        // "09:00"
  end: string;          // "10:00"
  start_datetime: string; // ISO datetime
  end_datetime: string;   // ISO datetime
}

export interface AvailableSlotsResponse {
  provider_id: number;
  date: string;
  duration_minutes: number;
  slots: AvailableSlot[];
  total_available: number;
}

export function useAvailableSlots(
  providerId: number,
  date: string,
  durationMinutes: number = 60,
) {
  return useQuery({
    queryKey: ['available-slots', providerId, date, durationMinutes],
    queryFn: () =>
      apiClient.get<AvailableSlotsResponse>(
        `${endpoints.public.providerAvailableSlots(providerId)}?date=${date}&duration=${durationMinutes}`,
      ),
    enabled: !!date && !!providerId,
  });
}
