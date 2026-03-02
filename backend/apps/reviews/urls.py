"""
Review URLs
"""

from django.urls import path

from .views import OrderReviewCreateView, ProviderReviewListView

urlpatterns = [
    path("orders/<int:order_id>/reviews/", OrderReviewCreateView.as_view(), name="order_review_create"),
    path("providers/<int:provider_id>/reviews/", ProviderReviewListView.as_view(), name="provider_review_list"),
]
