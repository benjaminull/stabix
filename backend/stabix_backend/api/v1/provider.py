"""
Provider URL patterns: dashboard, profile, listings, matches, orders, availability, calendar
"""

from django.urls import include, path

from apps.users.views import (
    ProviderProfileDetailView,
    provider_dashboard,
    update_availability,
)
from apps.listings.views import ProviderListingDetailView, ProviderListingListCreateView
from apps.jobs.views import ProviderMatchListView, accept_match, reject_match
from apps.orders.views import ProviderOrderListView, update_order_status

urlpatterns = [
    # Profile & dashboard
    path("me/", ProviderProfileDetailView.as_view(), name="provider_profile"),
    path("dashboard/", provider_dashboard, name="provider_dashboard"),
    path("availability/", update_availability, name="provider_availability"),
    # Listings
    path("listings/", ProviderListingListCreateView.as_view(), name="provider_listings"),
    path("listings/<int:pk>/", ProviderListingDetailView.as_view(), name="provider_listing_detail"),
    # Matches
    path("matches/", ProviderMatchListView.as_view(), name="provider_matches"),
    path("matches/<int:pk>/accept/", accept_match, name="match_accept"),
    path("matches/<int:pk>/reject/", reject_match, name="match_reject"),
    # Orders
    path("orders/", ProviderOrderListView.as_view(), name="provider_orders"),
    path("orders/<int:pk>/status/", update_order_status, name="provider_order_status"),
    # Calendar & appointments
    path("calendar/", include("apps.appointments.urls")),
]
