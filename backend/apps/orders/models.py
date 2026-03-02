"""
Order/Booking models
"""

from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimestampedModel


class Order(TimestampedModel):
    """
    An order/booking created from an accepted match
    """

    STATUS_CHOICES = [
        ("created", "Created"),
        ("paid", "Paid"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    job_request = models.ForeignKey(
        "jobs.JobRequest", on_delete=models.CASCADE, related_name="orders"
    )
    match = models.OneToOneField(
        "jobs.Match", on_delete=models.CASCADE, related_name="order"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Final agreed amount in USD",
    )
    payment_ref = models.CharField(
        max_length=255, blank=True, help_text="Payment gateway reference"
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)

    class Meta:
        db_table = "orders"
        indexes = [
            models.Index(fields=["job_request", "status"]),
            models.Index(fields=["match", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"Order #{self.id} - Job {self.job_request.id}"

    @property
    def customer(self):
        return self.job_request.user

    @property
    def provider(self):
        return self.match.provider
