"""
Job and match serializers
"""

from rest_framework import serializers

from apps.taxonomy.serializers import ServiceListSerializer
from apps.users.serializers import ProviderProfileListSerializer

from .models import JobRequest, Match


class JobRequestSerializer(serializers.ModelSerializer):
    """Job request serializer"""

    service_details = ServiceListSerializer(source="service", read_only=True)
    location_lat = serializers.FloatField(write_only=True, required=True)
    location_lng = serializers.FloatField(write_only=True, required=True)

    class Meta:
        model = JobRequest
        fields = [
            "id",
            "user",
            "service",
            "service_details",
            "location",
            "location_lat",
            "location_lng",
            "details",
            "budget_estimate",
            "status",
            "preferred_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "location", "status", "created_at", "updated_at"]

    def create(self, validated_data):
        lat = validated_data.pop("location_lat")
        lng = validated_data.pop("location_lng")

        from django.contrib.gis.geos import Point

        validated_data["location"] = Point(lng, lat, srid=4326)
        return super().create(validated_data)


class MatchSerializer(serializers.ModelSerializer):
    """Match serializer"""

    provider_details = ProviderProfileListSerializer(source="provider", read_only=True)
    job_request_details = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            "id",
            "job_request",
            "job_request_details",
            "provider",
            "provider_details",
            "score",
            "status",
            "eta_minutes",
            "price_quote",
            "provider_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "job_request", "provider", "score", "created_at", "updated_at"]

    def get_job_request_details(self, obj):
        result = {
            "id": obj.job_request.id,
            "service": obj.job_request.service.name,
            "details": obj.job_request.details,
            "preferred_date": str(obj.job_request.preferred_date) if obj.job_request.preferred_date else None,
            "budget_estimate": str(obj.job_request.budget_estimate) if obj.job_request.budget_estimate else None,
        }
        # Expose guest phone if available
        if hasattr(obj.job_request, "guest_phone") and obj.job_request.guest_phone:
            result["guest_phone"] = obj.job_request.guest_phone
        # Expose customer phone if available
        if obj.job_request.user and obj.job_request.user.phone:
            result["customer_phone"] = obj.job_request.user.phone
        return result


class MatchAcceptSerializer(serializers.Serializer):
    """Serializer for accepting a match"""

    price_quote = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    eta_minutes = serializers.IntegerField(required=False)
    provider_notes = serializers.CharField(required=False, allow_blank=True)


class GuestBookingSerializer(serializers.Serializer):
    """Serializer for guest (no-auth) bookings"""

    guest_name = serializers.CharField(max_length=100)
    guest_email = serializers.EmailField()
    guest_phone = serializers.CharField(max_length=20)
    provider_id = serializers.IntegerField()
    listing_id = serializers.IntegerField(required=False)
    service = serializers.IntegerField()
    location_lat = serializers.FloatField()
    location_lng = serializers.FloatField()
    details = serializers.CharField(min_length=10)
    preferred_date = serializers.DateField()
    preferred_time_slot = serializers.CharField()
