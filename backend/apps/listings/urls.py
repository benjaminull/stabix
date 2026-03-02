"""
Listing URLs
"""

from django.urls import path

from .views import (
    ListingDetailView,
    ListingListView,
    ProviderDetailView,
    ProviderSearchView,
)

urlpatterns = [
    path("providers/", ProviderSearchView.as_view(), name="provider_search"),
    path("providers/<int:pk>/", ProviderDetailView.as_view(), name="provider_detail"),
    path("listings/", ListingListView.as_view(), name="listing_list"),
    path("listings/<int:pk>/", ListingDetailView.as_view(), name="listing_detail"),
]
