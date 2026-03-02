"""
Listing models - provider service offerings
"""

from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimestampedModel


class Listing(TimestampedModel):
    """
    A provider's service offering/listing
    """

    provider = models.ForeignKey(
        "users.ProviderProfile", on_delete=models.CASCADE, related_name="listings"
    )
    service = models.ForeignKey(
        "taxonomy.Service", on_delete=models.CASCADE, related_name="listings"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Base price in USD",
    )
    price_unit = models.CharField(
        max_length=50, default="per hour", help_text="e.g., 'per hour', 'per job', 'per sqft'"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "listings"
        indexes = [
            models.Index(fields=["provider", "is_active"]),
            models.Index(fields=["service", "is_active"]),
        ]

    def __str__(self):
        return f"{self.title} by {self.provider.user.email}"
