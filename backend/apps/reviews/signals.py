"""
Review app signals
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Review


@receiver(post_save, sender=Review)
def update_provider_rating_on_review_save(sender, instance, **kwargs):
    """
    Update provider's average rating when a new review is created
    """
    provider_profile = instance.provider
    provider_profile.update_rating()
