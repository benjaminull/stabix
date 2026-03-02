"""
Celery tasks for reviews app
"""

from celery import shared_task


@shared_task
def update_provider_ranking():
    """
    Periodic task to recalculate provider rankings based on reviews and performance
    """
    from apps.users.models import ProviderProfile

    updated_count = 0
    for provider in ProviderProfile.objects.filter(is_active=True):
        provider.update_rating()
        updated_count += 1

    return {"status": "success", "providers_updated": updated_count}


@shared_task
def send_review_request(order_id):
    """
    Send review request to customer after order completion (stub implementation)
    """
    from apps.orders.models import Order

    try:
        order = Order.objects.get(id=order_id)
        if order.status == "completed":
            # TODO: Implement actual review request email
            print(f"Sending review request for Order #{order.id} to {order.customer.email}")
            return {"status": "success", "order_id": order_id}
    except Order.DoesNotExist:
        return {"status": "error", "message": "Order not found"}
