"""
Order app signals
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order


@receiver(post_save, sender=Order)
def update_job_request_status_on_order_creation(sender, instance, created, **kwargs):
    """
    Update job request status when an order is created
    """
    if created:
        instance.job_request.status = "ordered"
        instance.job_request.save(update_fields=["status", "updated_at"])


@receiver(post_save, sender=Order)
def update_provider_stats_on_order_completion(sender, instance, **kwargs):
    """
    Update provider stats when an order is completed
    """
    if instance.status == "completed":
        provider_profile = instance.provider
        provider_profile.total_completed_orders += 1
        provider_profile.save(update_fields=["total_completed_orders", "updated_at"])
