"""
Celery tasks for jobs app
"""

from celery import shared_task

from .services import run_matching


@shared_task(bind=True, max_retries=3)
def run_matching_task(self, job_request_id):
    """
    Asynchronous task to run matching for a job request
    """
    try:
        result = run_matching(job_request_id)
        return result
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def cleanup_expired_matches():
    """
    Periodic task to mark expired pending matches
    """
    from datetime import timedelta

    from django.utils import timezone

    from .models import Match

    expiry_time = timezone.now() - timedelta(hours=24)
    expired_count = Match.objects.filter(
        status="pending", created_at__lt=expiry_time
    ).update(status="expired")

    return {"expired_matches": expired_count}
