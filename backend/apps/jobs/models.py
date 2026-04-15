"""
Job request and matching models
"""

from django.contrib.gis.db import models as gis_models
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimestampedModel


class JobRequest(TimestampedModel):
    """
    A customer's service request
    """

    STATUS_CHOICES = [
        ("open", "Open"),
        ("matched", "Matched"),
        ("ordered", "Ordered"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="job_requests",
        null=True, blank=True,
    )
    service = models.ForeignKey(
        "taxonomy.Service", on_delete=models.CASCADE, related_name="job_requests"
    )
    location = gis_models.PointField(
        geography=True, help_text="Service location (lon, lat)"
    )
    details = models.TextField(help_text="Job description and requirements")
    budget_estimate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Customer's budget estimate in USD",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    preferred_date = models.DateTimeField(null=True, blank=True)

    # Guest booking fields
    guest_name = models.CharField(max_length=100, blank=True)
    guest_email = models.EmailField(blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)

    # Direct booking fields
    target_provider = models.ForeignKey(
        "users.ProviderProfile", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="direct_requests",
    )
    target_listing = models.ForeignKey(
        "listings.Listing", null=True, blank=True,
        on_delete=models.SET_NULL,
    )
    preferred_time_slot = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "job_requests"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["service", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        requester = self.user.email if self.user else self.guest_email or "Guest"
        return f"Job #{self.id} - {self.service.name} by {requester}"


class Match(TimestampedModel):
    """
    A potential match between a job request and a provider
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
    ]

    job_request = models.ForeignKey(
        JobRequest, on_delete=models.CASCADE, related_name="matches"
    )
    provider = models.ForeignKey(
        "users.ProviderProfile", on_delete=models.CASCADE, related_name="matches"
    )
    score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0)],
        help_text="Matching score (0-1)",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    eta_minutes = models.PositiveIntegerField(
        null=True, blank=True, help_text="Estimated time to arrival in minutes"
    )
    price_quote = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Provider's price quote in USD",
    )
    provider_notes = models.TextField(blank=True)

    class Meta:
        db_table = "matches"
        unique_together = [["job_request", "provider"]]
        indexes = [
            models.Index(fields=["job_request", "status"]),
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["score"]),
        ]

    def __str__(self):
        return f"Match #{self.id} - Job {self.job_request.id} with {self.provider.user.email}"
