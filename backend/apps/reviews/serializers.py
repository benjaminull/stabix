"""
Review serializers
"""

from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Review serializer"""

    reviewer_email = serializers.EmailField(source="reviewer.email", read_only=True)
    provider_email = serializers.EmailField(source="provider.user.email", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "order",
            "reviewer_email",
            "provider_email",
            "rating",
            "comment",
            "is_public",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "order", "created_at", "updated_at"]

    def validate_order(self, value):
        """Validate that order is completed"""
        if value.status != "completed":
            raise serializers.ValidationError("Can only review completed orders")
        if hasattr(value, "review"):
            raise serializers.ValidationError("This order has already been reviewed")
        return value


class ReviewListSerializer(serializers.ModelSerializer):
    """Lightweight review serializer for list views"""

    reviewer_name = serializers.CharField(
        source="reviewer.get_full_name", read_only=True, default="Anonymous"
    )

    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "reviewer_name", "created_at"]
