"""
Public endpoint to compute available time slots for a provider on a given date.

Given a provider ID, a date, and a service duration, this module:
1. Looks up the provider's WorkingHours for that weekday.
2. Fetches existing Appointments that overlap that day.
3. Returns a list of available start times (in 30-min increments)
   where the full duration fits without conflicts.
"""

from datetime import datetime, timedelta

import zoneinfo

from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.appointments.models import Appointment, WorkingHours
from apps.users.models import ProviderProfile

SLOT_INCREMENT_MINUTES = 30
DEFAULT_DURATION_MINUTES = 60

# Working hours are interpreted in this timezone
LOCAL_TZ = zoneinfo.ZoneInfo("America/Santiago")


def _get_available_slots(provider, date_obj, duration_minutes):
    """
    Returns a list of dicts: [{"start": "09:00", "end": "10:00"}, ...]
    representing available slots for the provider on date_obj.
    Working hours are treated as local time (America/Santiago).
    """
    weekday = date_obj.weekday()  # 0=Monday

    # 1) Get working hours for this weekday
    working_hours = WorkingHours.objects.filter(
        provider=provider, weekday=weekday, is_active=True
    ).order_by("start_time")

    if not working_hours.exists():
        return []

    # 2) Get existing appointments for this date (non-cancelled)
    day_start = datetime.combine(date_obj, datetime.min.time(), tzinfo=LOCAL_TZ)
    day_end = day_start + timedelta(days=1)

    booked = Appointment.objects.filter(
        provider=provider,
        start_datetime__lt=day_end,
        end_datetime__gt=day_start,
    ).exclude(status__in=["cancelled", "no_show"]).values_list(
        "start_datetime", "end_datetime"
    )

    booked_ranges = [(s, e) for s, e in booked]

    # 3) Generate candidate slots within each working-hours window
    slots = []
    duration = timedelta(minutes=duration_minutes)
    increment = timedelta(minutes=SLOT_INCREMENT_MINUTES)
    now = timezone.now()

    for wh in working_hours:
        # Interpret working hours as local time
        window_start = datetime.combine(date_obj, wh.start_time, tzinfo=LOCAL_TZ)
        window_end = datetime.combine(date_obj, wh.end_time, tzinfo=LOCAL_TZ)

        cursor = window_start
        while cursor + duration <= window_end:
            slot_end = cursor + duration

            # Check no overlap with booked appointments
            conflict = any(
                cursor < booked_end and slot_end > booked_start
                for booked_start, booked_end in booked_ranges
            )

            # Skip past slots (if date is today)
            is_past = cursor <= now

            if not conflict and not is_past:
                # Return display times in local timezone
                local_start = cursor.astimezone(LOCAL_TZ)
                local_end = slot_end.astimezone(LOCAL_TZ)
                slots.append({
                    "start": local_start.strftime("%H:%M"),
                    "end": local_end.strftime("%H:%M"),
                    "start_datetime": cursor.isoformat(),
                    "end_datetime": slot_end.isoformat(),
                })

            cursor += increment

    return slots


@extend_schema(
    tags=["Bookings"],
    description="Get available time slots for a provider on a specific date",
    parameters=[
        OpenApiParameter("date", str, description="Date in YYYY-MM-DD format", required=True),
        OpenApiParameter("duration", int, description="Service duration in minutes (default 60)", required=False),
    ],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def provider_available_slots(request, provider_id):
    """
    GET /api/v1/providers/<id>/available-slots/?date=2025-04-22&duration=90
    Returns available booking slots for the given provider and date.
    """
    try:
        provider = ProviderProfile.objects.get(pk=provider_id, is_active=True)
    except ProviderProfile.DoesNotExist:
        return Response(
            {"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    date_str = request.query_params.get("date")
    if not date_str:
        return Response(
            {"error": "Parámetro 'date' es requerido (YYYY-MM-DD)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response(
            {"error": "Formato de fecha inválido. Usa YYYY-MM-DD"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    duration = int(request.query_params.get("duration", DEFAULT_DURATION_MINUTES))
    if duration < 15:
        duration = 15

    slots = _get_available_slots(provider, date_obj, duration)

    return Response({
        "provider_id": provider_id,
        "date": date_str,
        "duration_minutes": duration,
        "slots": slots,
        "total_available": len(slots),
    })
