"""
Public URL patterns: categories, services, providers, listings (no auth required)
"""

from django.urls import path

from apps.jobs.views import guest_booking
from apps.taxonomy.views import ServiceCategoryListView, ServiceListView
from apps.listings.views import (
    ListingDetailView,
    ListingListView,
    ProviderDetailView,
    ProviderListingsPublicView,
    ProviderSearchView,
)
from apps.reviews.views import ProviderReviewListView

urlpatterns = [
    # Taxonomy
    path("categories/", ServiceCategoryListView.as_view(), name="category_list"),
    path("services/", ServiceListView.as_view(), name="service_list"),
    # Providers
    path("providers/", ProviderSearchView.as_view(), name="provider_search"),
    path("providers/<int:pk>/", ProviderDetailView.as_view(), name="provider_detail"),
    path("providers/<int:provider_id>/reviews/", ProviderReviewListView.as_view(), name="provider_review_list"),
    path("providers/<int:provider_id>/listings/", ProviderListingsPublicView.as_view(), name="provider_public_listings"),
    # Listings
    path("listings/", ListingListView.as_view(), name="listing_list"),
    path("listings/<int:pk>/", ListingDetailView.as_view(), name="listing_detail"),
    # Booking
    path("book/", guest_booking, name="guest_booking"),
]
