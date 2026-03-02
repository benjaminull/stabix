"""
Pytest configuration and fixtures
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from apps.listings.models import Listing
from apps.taxonomy.models import Service, ServiceCategory
from apps.users.models import ProviderProfile

User = get_user_model()


@pytest.fixture
def api_client():
    """Return API client"""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a regular user"""
    return User.objects.create_user(
        email="user@test.com",
        username="testuser",
        password="testpass123",
    )


@pytest.fixture
def provider_user(db):
    """Create a provider user"""
    return User.objects.create_user(
        email="provider@test.com",
        username="testprovider",
        password="testpass123",
        is_provider=True,
    )


@pytest.fixture
def service_category(db):
    """Create a service category"""
    return ServiceCategory.objects.create(
        name="Home Services",
        slug="home-services",
        description="Home maintenance and repair services",
    )


@pytest.fixture
def service(db, service_category):
    """Create a service"""
    return Service.objects.create(
        category=service_category,
        name="Plumbing",
        slug="plumbing",
        description="Plumbing services",
    )


@pytest.fixture
def provider_profile(db, provider_user, service_category):
    """Create a provider profile"""
    return ProviderProfile.objects.create(
        user=provider_user,
        location=Point(-118.2437, 34.0522, srid=4326),  # Los Angeles
        radius_km=20.0,
        price_band="standard",
        is_active=True,
        is_verified=True,
        average_rating=4.5,
        total_reviews=10,
    )


@pytest.fixture
def listing(db, provider_profile, service):
    """Create a listing"""
    return Listing.objects.create(
        provider=provider_profile,
        service=service,
        title="Professional Plumbing Services",
        description="Expert plumbing repair and installation",
        base_price=75.00,
        price_unit="per hour",
        is_active=True,
    )
