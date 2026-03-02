"""
Review and rating models
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimestampedModel


class Review(TimestampedModel):
    """
    Customer review of a completed order
    """

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="review"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars",
    )
    comment = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)

    class Meta:
        db_table = "reviews"
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["rating"]),
            models.Index(fields=["is_public", "created_at"]),
        ]

    def __str__(self):
        return f"Review for Order #{self.order.id} - {self.rating} stars"

    @property
    def reviewer(self):
        return self.order.customer

    @property
    def provider(self):
        return self.order.provider
