"""
Listing serializers
"""

from rest_framework import serializers

from apps.taxonomy.serializers import ServiceListSerializer
from apps.users.serializers import ProviderProfileListSerializer

from .models import Listing


class ListingSerializer(serializers.ModelSerializer):
    """Listing serializer"""

    provider_details = ProviderProfileListSerializer(source="provider", read_only=True)
    service_details = ServiceListSerializer(source="service", read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id",
            "provider",
            "provider_details",
            "service",
            "service_details",
            "title",
            "description",
            "base_price",
            "price_unit",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ListingListSerializer(serializers.ModelSerializer):
    """Lightweight listing serializer for list views"""

    service_name = serializers.CharField(source="service.name", read_only=True)
    provider_rating = serializers.FloatField(source="provider.average_rating", read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id",
            "title",
            "service_name",
            "base_price",
            "price_unit",
            "provider_rating",
        ]
