"""
Tests for listing views including geospatial search
"""

import pytest
from django.contrib.gis.geos import Point
from django.urls import reverse

from apps.users.models import ProviderProfile


@pytest.mark.django_db
class TestProviderSearchView:
    """Test provider search with geospatial filtering"""

    def test_search_providers_without_location(self, api_client, provider_profile):
        """Test searching providers without location filter"""
        url = reverse("provider_search")
        response = api_client.get(url)

        assert response.status_code == 200
        assert len(response.data["results"]) >= 1

    def test_search_providers_with_location(self, api_client, provider_profile):
        """Test searching providers with location and radius"""
        url = reverse("provider_search")
        # Search near Los Angeles (provider location)
        response = api_client.get(url, {
            "lat": 34.0522,
            "lng": -118.2437,
            "radius_km": 10,
        })

        assert response.status_code == 200
        assert len(response.data["results"]) >= 1
        # Check distance annotation
        assert "distance_km" in response.data["results"][0]

    def test_search_providers_far_location(self, api_client, provider_profile):
        """Test searching providers with far location"""
        url = reverse("provider_search")
        # Search in New York (far from provider)
        response = api_client.get(url, {
            "lat": 40.7128,
            "lng": -74.0060,
            "radius_km": 10,
        })

        assert response.status_code == 200
        assert len(response.data["results"]) == 0


@pytest.mark.django_db
class TestListingListView:
    """Test listing list view"""

    def test_list_listings(self, api_client, listing):
        """Test listing listings"""
        url = reverse("listing_list")
        response = api_client.get(url)

        assert response.status_code == 200
        assert len(response.data["results"]) >= 1

    def test_filter_listings_by_service(self, api_client, listing):
        """Test filtering listings by service"""
        url = reverse("listing_list")
        response = api_client.get(url, {"service": "plumbing"})

        assert response.status_code == 200
        assert len(response.data["results"]) >= 1
