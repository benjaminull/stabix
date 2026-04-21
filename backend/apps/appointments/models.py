"""
Appointment and scheduling models for provider calendar
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimestampedModel


class WorkingHours(TimestampedModel):
    """
    Provider's recurring working hours schedule
    Example: Mon-Fri 9:00-17:00
    """

    WEEKDAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    provider = models.ForeignKey(
        "users.ProviderProfile", on_delete=models.CASCADE, related_name="working_hours"
    )
    weekday = models.IntegerField(
        choices=WEEKDAY_CHOICES, validators=[MinValueValidator(0), MaxValueValidator(6)]
    )
    start_time = models.TimeField(help_text="Start time (e.g., 09:00)")
    end_time = models.TimeField(help_text="End time (e.g., 17:00)")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "working_hours"
        indexes = [
            models.Index(fields=["provider", "weekday", "is_active"]),
        ]
        unique_together = ["provider", "weekday", "start_time", "end_time"]
        ordering = ["weekday", "start_time"]

    def __str__(self):
        return f"{self.provider.user.email} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class Appointment(TimestampedModel):
    """
    Calendar appointment for a provider
    Can be linked to an order or be an external appointment
    """

    APPOINTMENT_TYPE_CHOICES = [
        ("order", "Platform Order"),  # From Stabix order
        ("external", "External Client"),  # Client outside platform
        ("personal", "Personal/Blocked"),  # Personal time off
    ]

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("confirmed", "Confirmed"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("no_show", "No Show"),
    ]

    provider = models.ForeignKey(
        "users.ProviderProfile", on_delete=models.CASCADE, related_name="appointments"
    )
    appointment_type = models.CharField(
        max_length=20, choices=APPOINTMENT_TYPE_CHOICES, default="order"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="scheduled"
    )

    # Link to platform order (if appointment_type='order')
    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="appointment",
    )

    # For external appointments
    client_name = models.CharField(
        max_length=200, blank=True, help_text="Client name for external appointments"
    )
    client_phone = models.CharField(
        max_length=20, blank=True, help_text="Client contact"
    )
    service_description = models.TextField(
        blank=True, help_text="Description of service for external appointments"
    )

    # Scheduling
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    duration_minutes = models.IntegerField(
        validators=[MinValueValidator(15)], help_text="Duration in minutes"
    )

    # Notes
    notes = models.TextField(blank=True, help_text="Provider notes")

    class Meta:
        db_table = "appointments"
        indexes = [
            models.Index(fields=["provider", "start_datetime"]),
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["order"]),
        ]
        ordering = ["start_datetime"]

    def __str__(self):
        return f"{self.provider.user.email} - {self.start_datetime} ({self.get_appointment_type_display()})"

    @property
    def client(self):
        """Get client info (from order or external)"""
        if self.appointment_type == "order" and self.order:
            customer = self.order.customer
            if customer:
                return {
                    "name": customer.get_full_name(),
                    "email": customer.email,
                    "phone": customer.phone or "",
                }
            # Guest booking — pull from job_request guest fields
            jr = self.order.job_request
            return {
                "name": jr.guest_name or "Cliente",
                "email": jr.guest_email or "",
                "phone": jr.guest_phone or "",
            }
        return {
            "name": self.client_name,
            "phone": self.client_phone,
        }


class TimeSlotProposal(TimestampedModel):
    """
    Time slot proposals sent by clients when requesting service
    Client proposes 2-3 options, provider selects one
    """

    STATUS_CHOICES = [
        ("pending", "Pending Provider Response"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
    ]

    job_request = models.ForeignKey(
        "jobs.JobRequest",
        on_delete=models.CASCADE,
        related_name="time_slot_proposals",
    )
    provider = models.ForeignKey(
        "users.ProviderProfile",
        on_delete=models.CASCADE,
        related_name="time_slot_proposals",
    )

    # Proposed time slots (up to 3)
    proposed_datetime_1 = models.DateTimeField()
    proposed_datetime_2 = models.DateTimeField(null=True, blank=True)
    proposed_datetime_3 = models.DateTimeField(null=True, blank=True)

    # Duration for all proposed slots
    duration_minutes = models.IntegerField(
        validators=[MinValueValidator(15)],
        default=60,
        help_text="Expected duration in minutes",
    )

    # Provider response
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    selected_datetime = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Which proposed time slot the provider selected",
    )
    provider_notes = models.TextField(blank=True, help_text="Provider response notes")
    responded_at = models.DateTimeField(null=True, blank=True)

    # Auto-expire if not responded
    expires_at = models.DateTimeField(
        help_text="Proposal expires if provider doesn't respond by this time"
    )

    class Meta:
        db_table = "time_slot_proposals"
        indexes = [
            models.Index(fields=["job_request", "status"]),
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["status", "expires_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Proposal for Job #{self.job_request.id} - {self.status}"

    @property
    def customer(self):
        return self.job_request.user
