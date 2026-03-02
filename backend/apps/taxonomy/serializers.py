"""
Taxonomy serializers
"""

from rest_framework import serializers

from .models import Service, ServiceCategory


class ServiceCategorySerializer(serializers.ModelSerializer):
    """Service category serializer"""

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description", "icon", "is_active", "order"]
        read_only_fields = ["id"]


class ServiceSerializer(serializers.ModelSerializer):
    """Service serializer"""

    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "description",
            "is_active",
            "order",
        ]
        read_only_fields = ["id"]


class ServiceListSerializer(serializers.ModelSerializer):
    """Lightweight service serializer for list views"""

    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "slug", "category_slug"]
