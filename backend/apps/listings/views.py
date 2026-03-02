"""
Listing and provider search views with geospatial filtering
"""

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import generics

from apps.users.models import ProviderProfile
from apps.users.serializers import ProviderProfileListSerializer

from .models import Listing
from .serializers import ListingListSerializer, ListingSerializer


@extend_schema_view(
    get=extend_schema(
        tags=["Providers"],
        description="Search providers by location, radius, and filters",
        parameters=[
            OpenApiParameter(
                "lat", float, description="Latitude", required=False
            ),
            OpenApiParameter(
                "lng", float, description="Longitude", required=False
            ),
            OpenApiParameter(
                "radius_km", float, description="Search radius in km (default: 10)", required=False
            ),
            OpenApiParameter(
                "category", str, description="Filter by category slug", required=False
            ),
            OpenApiParameter(
                "q", str, description="Search query", required=False
            ),
        ],
    )
)
class ProviderSearchView(generics.ListAPIView):
    """Search providers with geospatial filtering"""

    serializer_class = ProviderProfileListSerializer

    def get_queryset(self):
        queryset = ProviderProfile.objects.filter(is_active=True, is_verified=True)

        # Geospatial filtering
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius_km = float(self.request.query_params.get("radius_km", 10))

        if lat and lng:
            point = Point(float(lng), float(lat), srid=4326)
            queryset = queryset.annotate(
                distance_km=Distance("location", point) / 1000
            ).filter(distance_km__lte=radius_km)

        # Category filter
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(categories__slug=category_slug)

        # Search query
        search_query = self.request.query_params.get("q")
        if search_query:
            queryset = queryset.filter(user__email__icontains=search_query) | queryset.filter(
                bio__icontains=search_query
            )

        # Order by distance if location provided, otherwise by rating
        if lat and lng:
            queryset = queryset.order_by("distance_km", "-average_rating")
        else:
            queryset = queryset.order_by("-average_rating", "-total_reviews")

        return queryset.distinct()


@extend_schema_view(
    get=extend_schema(
        tags=["Listings"],
        description="List listings with optional filters",
        parameters=[
            OpenApiParameter(
                "service", str, description="Filter by service slug", required=False
            ),
            OpenApiParameter(
                "lat", float, description="Latitude for distance filtering", required=False
            ),
            OpenApiParameter(
                "lng", float, description="Longitude for distance filtering", required=False
            ),
            OpenApiParameter(
                "radius_km", float, description="Search radius in km", required=False
            ),
        ],
    )
)
class ListingListView(generics.ListAPIView):
    """List listings with filters"""

    serializer_class = ListingListSerializer

    def get_queryset(self):
        queryset = Listing.objects.filter(
            is_active=True, provider__is_active=True
        ).select_related("provider", "service")

        # Service filter
        service_slug = self.request.query_params.get("service")
        if service_slug:
            queryset = queryset.filter(service__slug=service_slug)

        # Geospatial filtering
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius_km = self.request.query_params.get("radius_km")

        if lat and lng and radius_km:
            point = Point(float(lng), float(lat), srid=4326)
            queryset = queryset.filter(
                provider__location__distance_lte=(point, D(km=float(radius_km)))
            )

        return queryset


@extend_schema_view(
    get=extend_schema(tags=["Listings"], description="Get listing details")
)
class ListingDetailView(generics.RetrieveAPIView):
    """Listing detail view"""

    queryset = Listing.objects.filter(is_active=True).select_related("provider", "service")
    serializer_class = ListingSerializer


@extend_schema_view(
    get=extend_schema(tags=["Providers"], description="Get provider details")
)
class ProviderDetailView(generics.RetrieveAPIView):
    """Provider detail view"""

    queryset = ProviderProfile.objects.filter(is_active=True)
    serializer_class = ProviderProfileListSerializer
