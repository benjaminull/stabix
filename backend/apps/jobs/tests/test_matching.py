"""
Tests for job matching engine
"""

import pytest
from django.contrib.gis.geos import Point

from apps.jobs.models import JobRequest
from apps.jobs.services import MatchingEngine


@pytest.mark.django_db
class TestMatchingEngine:
    """Test matching engine"""

    def test_find_candidates(self, user, service, provider_profile):
        """Test finding candidate providers"""
        # Add service to provider's categories
        provider_profile.categories.add(service.category)

        # Create job request near provider
        job_request = JobRequest.objects.create(
            user=user,
            service=service,
            location=Point(-118.2437, 34.0522, srid=4326),  # Same as provider
            details="Need plumbing repair",
            budget_estimate=100.00,
        )

        engine = MatchingEngine(job_request)
        candidates = engine.find_candidates()

        assert candidates.count() >= 1
        assert provider_profile in candidates

    def test_calculate_score(self, user, service, provider_profile):
        """Test score calculation"""
        provider_profile.categories.add(service.category)

        job_request = JobRequest.objects.create(
            user=user,
            service=service,
            location=Point(-118.2437, 34.0522, srid=4326),
            details="Need plumbing repair",
            budget_estimate=100.00,
        )

        engine = MatchingEngine(job_request)
        candidates = engine.find_candidates()

        if candidates.exists():
            provider = candidates.first()
            score = engine.calculate_score(provider)

            assert 0.0 <= score <= 1.0
            assert isinstance(score, float)

    def test_create_matches(self, user, service, provider_profile):
        """Test creating matches"""
        provider_profile.categories.add(service.category)

        job_request = JobRequest.objects.create(
            user=user,
            service=service,
            location=Point(-118.2437, 34.0522, srid=4326),
            details="Need plumbing repair",
            budget_estimate=100.00,
        )

        engine = MatchingEngine(job_request)
        matches = engine.create_matches()

        assert len(matches) >= 1
        assert matches[0].job_request == job_request
        assert matches[0].provider == provider_profile
        assert matches[0].status == "pending"
