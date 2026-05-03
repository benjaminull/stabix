"""
Payment webhook URL patterns
"""

from django.urls import path

from apps.orders.views import mercadopago_webhook

urlpatterns = [
    path("webhook/", mercadopago_webhook, name="mercadopago_webhook"),
]
