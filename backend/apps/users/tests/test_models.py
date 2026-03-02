"""
Tests for user models
"""

import pytest
from django.contrib.gis.geos import Point

from apps.users.models import ProviderProfile, User


@pytest.mark.django_db
class TestUserModel:
    """Test User model"""

    def test_create_user(self):
        """Test creating a user"""
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
        assert user.email == "test@example.com"
        assert user.is_provider is False
        assert user.check_password("testpass123")

    def test_create_provider_user(self):
        """Test creating a provider user"""
        user = User.objects.create_user(
            email="provider@example.com",
            username="provider",
            password="testpass123",
            is_provider=True,
        )
        assert user.is_provider is True


@pytest.mark.django_db
class TestProviderProfileModel:
    """Test ProviderProfile model"""

    def test_create_provider_profile(self, provider_user, service_category):
        """Test creating a provider profile"""
        profile = ProviderProfile.objects.create(
            user=provider_user,
            location=Point(-118.2437, 34.0522, srid=4326),
            radius_km=15.0,
            price_band="standard",
        )
        assert profile.user == provider_user
        assert profile.radius_km == 15.0
        assert profile.price_band == "standard"
        assert profile.average_rating == 0.0

    def test_provider_profile_str(self, provider_profile):
        """Test provider profile string representation"""
        assert str(provider_profile) == f"{provider_profile.user.email} - Provider Profile"
