"""
Tests for taxonomy views
"""

import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestServiceCategoryListView:
    """Test service category list view"""

    def test_list_categories(self, api_client, service_category):
        """Test listing service categories"""
        url = reverse("category_list")
        response = api_client.get(url)

        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Home Services"


@pytest.mark.django_db
class TestServiceListView:
    """Test service list view"""

    def test_list_services(self, api_client, service):
        """Test listing services"""
        url = reverse("service_list")
        response = api_client.get(url)

        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Plumbing"

    def test_filter_services_by_category(self, api_client, service):
        """Test filtering services by category"""
        url = reverse("service_list")
        response = api_client.get(url, {"category": "home-services"})

        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Plumbing"
