import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export interface GuestBookingData {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  provider_id: number;
  listing_id?: number;
  service: number;
  location_lat: number;
  location_lng: number;
  details: string;
  preferred_date: string;
  preferred_time_slot?: string;
  start_datetime?: string;
  end_datetime?: string;
  duration_minutes?: number;
}

export interface BookingResponse {
  booking_ref: string;
  job_request_id: number;
  match_id: number;
  status: string;
}

export function useGuestBooking() {
  return useMutation({
    mutationFn: (data: GuestBookingData) => {
      const isAuthenticated = typeof window !== 'undefined' &&
        !!localStorage.getItem('stabix-auth');

      let auth = false;
      try {
        if (isAuthenticated) {
          const stored = JSON.parse(localStorage.getItem('stabix-auth') || '{}');
          auth = !!stored?.state?.accessToken;
        }
      } catch {
        // ignore
      }

      return apiClient.post<BookingResponse>(
        endpoints.public.book,
        data,
        { auth }
      );
    },
  });
}
