"""
Taxonomy views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics

from .models import Service, ServiceCategory
from .serializers import ServiceCategorySerializer, ServiceSerializer


@extend_schema_view(
    get=extend_schema(tags=["Taxonomy"], description="List all service categories")
)
class ServiceCategoryListView(generics.ListAPIView):
    """List all service categories"""

    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer


@extend_schema_view(
    get=extend_schema(tags=["Taxonomy"], description="List services, optionally filtered by category")
)
class ServiceListView(generics.ListAPIView):
    """List services, optionally filtered by category"""

    serializer_class = ServiceSerializer

    def get_queryset(self):
        queryset = Service.objects.filter(is_active=True).select_related("category")
        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset
