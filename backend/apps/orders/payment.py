"""
MercadoPago Checkout Pro integration
"""

import logging

import mercadopago
from django.conf import settings

logger = logging.getLogger(__name__)

sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)


def create_preference(order):
    """Create a MercadoPago Checkout Pro preference for the given order."""
    service_name = str(order.job_request.service) if order.job_request.service else f"Orden #{order.id}"

    preference_data = {
        "items": [
            {
                "title": service_name,
                "quantity": 1,
                "unit_price": float(order.amount),
                "currency_id": "CLP",
            }
        ],
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/orders/{order.id}?payment_status=approved",
            "failure": f"{settings.FRONTEND_URL}/orders/{order.id}?payment_status=failure",
            "pending": f"{settings.FRONTEND_URL}/orders/{order.id}?payment_status=pending",
        },
        "auto_return": "approved",
        "external_reference": str(order.id),
        "notification_url": f"{settings.BACKEND_URL}/api/v1/payments/webhook/",
    }

    result = sdk.preference().create(preference_data)
    response = result["response"]

    logger.info("MP preference created for order %s: %s", order.id, response.get("id"))

    return {
        "init_point": response["init_point"],
        "sandbox_init_point": response["sandbox_init_point"],
    }


def verify_payment(payment_id):
    """Verify a payment status via MercadoPago API."""
    result = sdk.payment().get(payment_id)
    payment = result["response"]

    return {
        "status": payment.get("status"),
        "external_reference": payment.get("external_reference"),
        "payment_id": str(payment.get("id")),
    }
