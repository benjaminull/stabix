"""
Job matching engine with geospatial scoring
"""

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

from apps.users.models import ProviderProfile

from .models import Match


class MatchingEngine:
    """
    Matching engine for finding suitable providers for job requests.

    Scoring formula:
    score = w1*distance_norm + w2*rating_norm + w3*availability_norm +
            w4*price_norm + w5*response_speed_norm

    All components normalized to [0, 1] range.
    """

    # Scoring weights (sum to 1.0)
    WEIGHT_DISTANCE = 0.35
    WEIGHT_RATING = 0.25
    WEIGHT_AVAILABILITY = 0.15
    WEIGHT_PRICE = 0.15
    WEIGHT_RESPONSE_SPEED = 0.10

    # Distance thresholds (km)
    MAX_DISTANCE_KM = 50.0

    def __init__(self, job_request):
        self.job_request = job_request

    def find_candidates(self, limit=10):
        """
        Find candidate providers for the job request.

        Returns:
            QuerySet of ProviderProfile objects with distance annotation
        """
        job_location = self.job_request.location
        service = self.job_request.service

        # Find providers offering this service within reasonable distance
        candidates = (
            ProviderProfile.objects.filter(
                is_active=True,
                is_verified=True,
                categories__services=service,
            )
            .annotate(distance_km=Distance("location", job_location) / 1000)
            .filter(distance_km__lte=self.MAX_DISTANCE_KM)
            .distinct()
        )

        return candidates[:limit]

    def calculate_score(self, provider):
        """
        Calculate matching score for a provider.

        Args:
            provider: ProviderProfile instance with distance_km annotation

        Returns:
            float: Matching score between 0 and 1
        """
        # Distance score (closer is better, inverted normalization)
        distance_km = getattr(provider, "distance_km", 0)
        distance_score = 1 - min(distance_km / self.MAX_DISTANCE_KM, 1.0)

        # Rating score (normalized to 0-1)
        rating_score = provider.average_rating / 5.0 if provider.total_reviews > 0 else 0.5

        # Availability score (stub - can be enhanced with actual availability check)
        availability_score = 0.8 if provider.availability else 0.5

        # Price score (budget vs standard vs premium)
        # Lower price band gets higher score for budget-conscious customers
        price_scores = {
            "budget": 1.0,
            "standard": 0.75,
            "premium": 0.5,
            "luxury": 0.25,
        }
        price_score = price_scores.get(provider.price_band, 0.5)

        # Response speed score (faster response time is better)
        if provider.average_response_time_minutes > 0:
            response_score = max(0, 1 - (provider.average_response_time_minutes / 120.0))
        else:
            response_score = 0.5

        # Weighted sum
        score = (
            self.WEIGHT_DISTANCE * distance_score
            + self.WEIGHT_RATING * rating_score
            + self.WEIGHT_AVAILABILITY * availability_score
            + self.WEIGHT_PRICE * price_score
            + self.WEIGHT_RESPONSE_SPEED * response_score
        )

        return min(max(score, 0.0), 1.0)  # Clamp to [0, 1]

    def create_matches(self, limit=5):
        """
        Create Match objects for the job request.

        Args:
            limit: Maximum number of matches to create

        Returns:
            List of created Match instances
        """
        candidates = self.find_candidates(limit=limit * 2)  # Get more candidates for scoring
        matches = []

        for provider in candidates:
            # Check if match already exists
            if Match.objects.filter(
                job_request=self.job_request, provider=provider
            ).exists():
                continue

            score = self.calculate_score(provider)

            # Create match if score is above threshold
            if score >= 0.3:  # Minimum score threshold
                match = Match.objects.create(
                    job_request=self.job_request,
                    provider=provider,
                    score=score,
                    status="pending",
                )
                matches.append(match)

        # Sort by score and limit
        matches.sort(key=lambda m: m.score, reverse=True)
        return matches[:limit]


def run_matching(job_request_id):
    """
    Celery task wrapper for running matching engine.

    Args:
        job_request_id: ID of the job request

    Returns:
        dict: Result summary
    """
    from .models import JobRequest

    try:
        job_request = JobRequest.objects.get(id=job_request_id)
        engine = MatchingEngine(job_request)
        matches = engine.create_matches()

        return {
            "status": "success",
            "job_request_id": job_request_id,
            "matches_created": len(matches),
            "match_ids": [m.id for m in matches],
        }
    except JobRequest.DoesNotExist:
        return {
            "status": "error",
            "job_request_id": job_request_id,
            "error": "Job request not found",
        }
