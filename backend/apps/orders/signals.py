"""
Order app signals
"""

import logging
import re
import zoneinfo
from datetime import date, datetime, timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Order

LOCAL_TZ = zoneinfo.ZoneInfo("America/Santiago")

logger = logging.getLogger(__name__)

DEFAULT_DURATION_MINUTES = 60

# Regex to extract hours from slot strings like "Mañana (9:00 - 13:00)"
_SLOT_RE = re.compile(r"\((\d{1,2}):00\s*-\s*(\d{1,2}):00\)")


def _parse_slot_hours(slot_str):
    """
    Extract (start_hour, end_hour) from any slot string like
    "Mañana (9:00 - 13:00)" or "Tarde (14:00 - 18:00)".
    Returns (9, 10) as fallback if parsing fails.
    """
    if not slot_str:
        return 9, 10
    m = _SLOT_RE.search(slot_str)
    if m:
        return int(m.group(1)), int(m.group(2))
    return 9, 10


def _ensure_datetime(value):
    """Convert a date to a timezone-aware datetime in local timezone."""
    if value is None:
        return None
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return value.replace(tzinfo=LOCAL_TZ)
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=LOCAL_TZ)
    return None


def _parse_appointment_times(order):
    """
    Derive start_datetime and end_datetime for an appointment from
    the job_request's explicit start/end datetimes, or fall back to
    preferred_date + preferred_time_slot parsing.
    Returns (start_datetime, end_datetime, duration_minutes).
    """
    job = order.job_request

    # 1) Best: job_request has explicit start/end datetimes (from slot picker)
    if job.start_datetime and job.end_datetime:
        start = _ensure_datetime(job.start_datetime)
        end = _ensure_datetime(job.end_datetime)
        duration = int((end - start).total_seconds() / 60)
        return start, end, duration

    # 2) If order has explicit scheduled_at, use it with job duration
    if order.scheduled_at:
        start = _ensure_datetime(order.scheduled_at)
        dur = job.duration_minutes or DEFAULT_DURATION_MINUTES
        return start, start + timedelta(minutes=dur), dur

    # 3) Fallback: build from preferred_date + preferred_time_slot string
    base_date = _ensure_datetime(job.preferred_date)
    if not base_date:
        start = order.created_at or timezone.now()
        return start, start + timedelta(minutes=DEFAULT_DURATION_MINUTES), DEFAULT_DURATION_MINUTES

    start_hour, end_hour = _parse_slot_hours(job.preferred_time_slot)

    start = base_date.replace(hour=start_hour, minute=0, second=0, microsecond=0)
    end = base_date.replace(hour=end_hour, minute=0, second=0, microsecond=0)
    duration = int((end - start).total_seconds() / 60)

    return start, end, duration


@receiver(post_save, sender=Order)
def update_job_request_status_on_order_creation(sender, instance, created, **kwargs):
    """
    Update job request status when an order is created
    """
    if created:
        instance.job_request.status = "ordered"
        instance.job_request.save(update_fields=["status", "updated_at"])


@receiver(post_save, sender=Order)
def create_appointment_on_order_creation(sender, instance, created, **kwargs):
    """
    Automatically create a calendar Appointment when an Order is created,
    so accepted bookings show up in the provider's schedule.
    """
    if not created:
        return

    from apps.appointments.models import Appointment

    # Don't duplicate if appointment already exists
    if Appointment.objects.filter(order=instance).exists():
        return

    try:
        start_dt, end_dt, duration = _parse_appointment_times(instance)
        provider = instance.match.provider

        Appointment.objects.create(
            provider=provider,
            appointment_type="order",
            status="scheduled",
            order=instance,
            start_datetime=start_dt,
            end_datetime=end_dt,
            duration_minutes=duration,
            notes=instance.match.provider_notes or "",
        )
        logger.info(f"Created appointment for Order #{instance.id} on {start_dt}")
    except Exception:
        logger.exception(f"Failed to create appointment for Order #{instance.id}")


@receiver(post_save, sender=Order)
def update_provider_stats_on_order_completion(sender, instance, **kwargs):
    """
    Update provider stats when an order is completed
    """
    if instance.status == "completed":
        provider_profile = instance.provider
        provider_profile.total_completed_orders += 1
        provider_profile.save(update_fields=["total_completed_orders", "updated_at"])
