"""
User and provider profile models
"""

from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimestampedModel


class User(AbstractUser, TimestampedModel):
    """
    Extended user model with email as unique identifier.
    """

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    is_provider = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["is_provider"]),
        ]

    def __str__(self):
        return self.email


class ProviderProfile(TimestampedModel):
    """
    Provider profile with geospatial location and service preferences.
    """

    PRICE_BAND_CHOICES = [
        ("budget", "Budget ($)"),
        ("standard", "Standard ($$)"),
        ("premium", "Premium ($$$)"),
        ("luxury", "Luxury ($$$$)"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="provider_profile"
    )
    location = gis_models.PointField(geography=True, help_text="Provider's location (lon, lat)")
    radius_km = models.FloatField(
        default=10.0,
        validators=[MinValueValidator(1.0), MaxValueValidator(100.0)],
        help_text="Service radius in kilometers",
    )
    categories = models.ManyToManyField(
        "taxonomy.ServiceCategory", related_name="providers", blank=True
    )
    availability = models.JSONField(
        default=dict,
        blank=True,
        help_text="Availability schedule in JSON format",
    )
    price_band = models.CharField(
        max_length=20, choices=PRICE_BAND_CHOICES, default="standard"
    )
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    average_rating = models.FloatField(
        default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    total_reviews = models.PositiveIntegerField(default=0)
    total_completed_orders = models.PositiveIntegerField(default=0)
    average_response_time_minutes = models.FloatField(default=0.0)

    class Meta:
        db_table = "provider_profiles"
        indexes = [
            models.Index(fields=["is_active", "is_verified"]),
            models.Index(fields=["average_rating"]),
        ]

    def __str__(self):
        return f"{self.user.email} - Provider Profile"

    def update_rating(self):
        """Update average rating from reviews"""
        from apps.reviews.models import Review

        reviews = Review.objects.filter(order__match__provider=self)
        if reviews.exists():
            self.average_rating = reviews.aggregate(models.Avg("rating"))["rating__avg"]
            self.total_reviews = reviews.count()
            self.save(update_fields=["average_rating", "total_reviews", "updated_at"])
