"""
Service taxonomy models - categories and services
"""

from django.db import models

from apps.common.models import TimestampedModel


class ServiceCategory(TimestampedModel):
    """
    Top-level service categories (e.g., Home Services, Professional Services)
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order")

    class Meta:
        db_table = "service_categories"
        ordering = ["order", "name"]
        verbose_name_plural = "Service Categories"

    def __str__(self):
        return self.name


class Service(TimestampedModel):
    """
    Specific services within categories (e.g., Plumbing, Electrical)
    """

    category = models.ForeignKey(
        ServiceCategory, on_delete=models.CASCADE, related_name="services"
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0, help_text="Display order")

    class Meta:
        db_table = "services"
        ordering = ["order", "name"]
        unique_together = [["category", "slug"]]

    def __str__(self):
        return f"{self.category.name} - {self.name}"
