"""
Job request and matching views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import JobRequest, Match
from .serializers import (
    JobRequestSerializer,
    MatchAcceptSerializer,
    MatchSerializer,
)
from .services import MatchingEngine


@extend_schema_view(
    post=extend_schema(tags=["Jobs"], description="Create a new job request"),
    get=extend_schema(tags=["Jobs"], description="List user's job requests"),
)
class JobRequestListCreateView(generics.ListCreateAPIView):
    """List and create job requests"""

    serializer_class = JobRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobRequest.objects.filter(user=self.request.user).select_related("service")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema_view(
    get=extend_schema(tags=["Jobs"], description="Get job request details")
)
class JobRequestDetailView(generics.RetrieveAPIView):
    """Job request detail view"""

    serializer_class = JobRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobRequest.objects.filter(user=self.request.user).select_related("service")


@extend_schema(
    tags=["Jobs"],
    description="Run matching algorithm to find providers for this job request",
    request=None,
    responses={200: MatchSerializer(many=True)},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_job_matching(request, pk):
    """Run matching for a job request"""
    try:
        job_request = JobRequest.objects.get(pk=pk, user=request.user)
    except JobRequest.DoesNotExist:
        return Response(
            {"error": "Job request not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if job_request.status != "open":
        return Response(
            {"error": "Job request is not open for matching"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Run matching engine
    engine = MatchingEngine(job_request)
    matches = engine.create_matches()

    serializer = MatchSerializer(matches, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(tags=["Jobs"], description="List matches for a job request")
)
class JobMatchListView(generics.ListAPIView):
    """List matches for a job request"""

    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        job_request_id = self.kwargs["job_request_id"]
        return (
            Match.objects.filter(job_request_id=job_request_id, job_request__user=self.request.user)
            .select_related("provider__user", "job_request__service")
            .order_by("-score")
        )


@extend_schema(
    tags=["Jobs"],
    description="Accept a match and optionally provide quote details",
    request=MatchAcceptSerializer,
    responses={200: MatchSerializer},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_match(request, pk):
    """Accept a match (provider endpoint)"""
    try:
        match = Match.objects.get(pk=pk, provider__user=request.user)
    except Match.DoesNotExist:
        return Response({"error": "Match not found"}, status=status.HTTP_404_NOT_FOUND)

    if match.status != "pending":
        return Response(
            {"error": "Match is not in pending state"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Update match with provider's response
    serializer = MatchAcceptSerializer(data=request.data)
    if serializer.is_valid():
        match.status = "accepted"
        if serializer.validated_data.get("price_quote"):
            match.price_quote = serializer.validated_data["price_quote"]
        if serializer.validated_data.get("eta_minutes"):
            match.eta_minutes = serializer.validated_data["eta_minutes"]
        if serializer.validated_data.get("provider_notes"):
            match.provider_notes = serializer.validated_data["provider_notes"]
        match.save()

        response_serializer = MatchSerializer(match)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
