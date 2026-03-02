"""
Order serializers
"""

from rest_framework import serializers

from apps.jobs.serializers import MatchSerializer

from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer"""

    match_details = MatchSerializer(source="match", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    provider_email = serializers.EmailField(source="provider.user.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "job_request",
            "match",
            "match_details",
            "customer_email",
            "provider_email",
            "status",
            "amount",
            "payment_ref",
            "scheduled_at",
            "started_at",
            "completed_at",
            "cancelled_at",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "job_request", "match", "created_at", "updated_at"]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Order creation serializer"""

    class Meta:
        model = Order
        fields = ["match", "amount", "scheduled_at"]

    def validate_match(self, value):
        """Validate that match is accepted and not already ordered"""
        if value.status != "accepted":
            raise serializers.ValidationError("Match must be accepted before creating an order")
        if hasattr(value, "order"):
            raise serializers.ValidationError("This match already has an order")
        return value

    def create(self, validated_data):
        match = validated_data["match"]
        validated_data["job_request"] = match.job_request
        return super().create(validated_data)


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight order serializer for list views"""

    service_name = serializers.CharField(source="job_request.service.name", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "service_name", "status", "amount", "scheduled_at", "created_at"]
