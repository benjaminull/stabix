"""
Job request and matching views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsProvider

from .models import JobRequest, Match
from .serializers import (
    GuestBookingSerializer,
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
@permission_classes([IsAuthenticated, IsProvider])
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

        # Crear notificación para el cliente (solo si tiene usuario registrado)
        if match.job_request.user:
            from apps.notifications.utils import notify_match_accepted
            notify_match_accepted(match.job_request.user, match)

        # Actualizar estado del job request a "ordered"
        match.job_request.status = "ordered"
        match.job_request.save(update_fields=['status'])

        # Auto-crear la orden (dispara signal que crea el Appointment)
        from apps.orders.models import Order
        job = match.job_request
        # Price priority: provider quote > listing base_price > client estimate
        amount = match.price_quote or 0
        if not amount and job.target_listing:
            amount = job.target_listing.base_price
        if not amount:
            amount = job.budget_estimate or 0
        Order.objects.create(
            job_request=job,
            match=match,
            amount=amount,
        )

        response_serializer = MatchSerializer(match)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=["Jobs"],
    description="Reject a match",
    request=None,
    responses={200: MatchSerializer},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsProvider])
def reject_match(request, pk):
    """Reject a match (provider endpoint)"""
    try:
        match = Match.objects.get(pk=pk, provider__user=request.user)
    except Match.DoesNotExist:
        return Response({"error": "Match not found"}, status=status.HTTP_404_NOT_FOUND)

    if match.status != "pending":
        return Response(
            {"error": "Match is not in pending state"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    match.status = "rejected"
    match.save(update_fields=['status'])

    # Crear notificación para el cliente (solo si tiene usuario registrado)
    if match.job_request.user:
        from apps.notifications.utils import notify_match_rejected
        notify_match_rejected(match.job_request.user, match)

    response_serializer = MatchSerializer(match)
    return Response(response_serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(tags=["Provider Matches"], description="List provider's matches")
)
class ProviderMatchListView(generics.ListAPIView):
    """List matches for the current provider"""

    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated, IsProvider]

    def get_queryset(self):
        from apps.users.models import ProviderProfile

        provider = ProviderProfile.objects.get(user=self.request.user)

        queryset = Match.objects.filter(
            provider=provider
        ).select_related(
            "job_request__service",
            "job_request__user"
        ).order_by('-created_at')

        # Filtro por estado
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


@extend_schema(
    tags=["Bookings"],
    description="Create a booking (works for guests and authenticated users)",
    request=GuestBookingSerializer,
    responses={201: dict},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def guest_booking(request):
    """Create a direct booking with a provider. No auth required."""
    serializer = GuestBookingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    from django.contrib.gis.geos import Point
    from apps.users.models import ProviderProfile
    from apps.listings.models import Listing

    # Validate provider exists
    try:
        provider = ProviderProfile.objects.get(pk=data["provider_id"], is_active=True)
    except ProviderProfile.DoesNotExist:
        return Response(
            {"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Validate listing if provided
    listing = None
    if data.get("listing_id"):
        try:
            listing = Listing.objects.get(
                pk=data["listing_id"], provider=provider, is_active=True
            )
        except Listing.DoesNotExist:
            return Response(
                {"error": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

    # Build job request
    is_authenticated = request.user and request.user.is_authenticated
    # Resolve service: prefer listing's service if available
    service_id = listing.service_id if listing else data["service"]
    job_request = JobRequest.objects.create(
        user=request.user if is_authenticated else None,
        service_id=service_id,
        location=Point(data["location_lng"], data["location_lat"], srid=4326),
        details=data["details"],
        preferred_date=data["preferred_date"],
        preferred_time_slot=data.get("preferred_time_slot", ""),
        start_datetime=data.get("start_datetime"),
        end_datetime=data.get("end_datetime"),
        duration_minutes=data.get("duration_minutes", 60),
        guest_name="" if is_authenticated else data["guest_name"],
        guest_email="" if is_authenticated else data["guest_email"],
        guest_phone="" if is_authenticated else data["guest_phone"],
        target_provider=provider,
        target_listing=listing,
    )

    # Create direct match
    match = Match.objects.create(
        job_request=job_request,
        provider=provider,
        score=1.0,
        status="pending",
    )

    # Notify provider
    from apps.notifications.utils import notify_new_match
    notify_new_match(provider, match)

    return Response(
        {
            "booking_ref": f"STB-{job_request.id}",
            "job_request_id": job_request.id,
            "match_id": match.id,
            "status": "pending",
        },
        status=status.HTTP_201_CREATED,
    )
