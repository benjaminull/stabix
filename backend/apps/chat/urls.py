"""
Chat URLs
"""

from django.urls import path

from .views import OrderMessageListCreateView

urlpatterns = [
    path(
        "orders/<int:order_id>/messages/",
        OrderMessageListCreateView.as_view(),
        name="order_message_list_create",
    ),
]
