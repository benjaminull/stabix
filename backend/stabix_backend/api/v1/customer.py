"""
Customer URL patterns: profile, job requests, orders, reviews, messages
"""

from django.urls import path

from apps.users.views import CurrentUserView
from apps.jobs.views import (
    JobRequestDetailView,
    JobRequestListCreateView,
    JobMatchListView,
    run_job_matching,
)
from apps.orders.views import OrderDetailView, OrderListCreateView
from apps.reviews.views import OrderReviewCreateView
from apps.chat.views import OrderMessageListCreateView

urlpatterns = [
    # Profile
    path("me/", CurrentUserView.as_view(), name="current_user"),
    # Job requests
    path("job-requests/", JobRequestListCreateView.as_view(), name="job_request_list_create"),
    path("job-requests/<int:pk>/", JobRequestDetailView.as_view(), name="job_request_detail"),
    path("job-requests/<int:pk>/match/", run_job_matching, name="job_request_match"),
    path("job-requests/<int:job_request_id>/matches/", JobMatchListView.as_view(), name="job_match_list"),
    # Orders
    path("orders/", OrderListCreateView.as_view(), name="order_list_create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order_detail"),
    # Reviews
    path("orders/<int:order_id>/reviews/", OrderReviewCreateView.as_view(), name="order_review_create"),
    # Messages
    path("orders/<int:order_id>/messages/", OrderMessageListCreateView.as_view(), name="order_message_list_create"),
]
