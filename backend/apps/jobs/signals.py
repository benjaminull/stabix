"""
Job app signals
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Match


@receiver(post_save, sender=Match)
def update_job_request_status_on_match_accept(sender, instance, created, **kwargs):
    """
    Update job request status when a match is accepted
    """
    if instance.status == "accepted" and instance.job_request.status == "open":
        instance.job_request.status = "matched"
        instance.job_request.save(update_fields=["status", "updated_at"])
