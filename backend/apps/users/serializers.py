"""
User serializers
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ProviderProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer"""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone",
            "phone_verified",
            "is_provider",
            "is_staff",
            "created_at",
        ]
        read_only_fields = ["id", "is_staff", "created_at"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "password_confirm", "first_name", "last_name"]

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class ProviderProfileSerializer(serializers.ModelSerializer):
    """Provider profile serializer"""

    user = UserSerializer(read_only=True)
    location_lat = serializers.FloatField(write_only=True, required=False)
    location_lng = serializers.FloatField(write_only=True, required=False)
    distance_km = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = ProviderProfile
        fields = [
            "id",
            "user",
            "location",
            "location_lat",
            "location_lng",
            "radius_km",
            "categories",
            "availability",
            "price_band",
            "bio",
            "is_active",
            "is_verified",
            "average_rating",
            "total_reviews",
            "total_completed_orders",
            "average_response_time_minutes",
            "distance_km",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "location",
            "is_verified",
            "average_rating",
            "total_reviews",
            "total_completed_orders",
            "average_response_time_minutes",
            "distance_km",
            "created_at",
        ]

    def create(self, validated_data):
        lat = validated_data.pop("location_lat", None)
        lng = validated_data.pop("location_lng", None)

        if lat is not None and lng is not None:
            from django.contrib.gis.geos import Point

            validated_data["location"] = Point(lng, lat, srid=4326)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop("location_lat", None)
        lng = validated_data.pop("location_lng", None)

        if lat is not None and lng is not None:
            from django.contrib.gis.geos import Point

            instance.location = Point(lng, lat, srid=4326)

        return super().update(instance, validated_data)


class ProviderProfileListSerializer(serializers.ModelSerializer):
    """Lightweight provider profile serializer for list views"""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    distance_km = serializers.FloatField(read_only=True, required=False)
    location = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = [
            "id",
            "user_email",
            "radius_km",
            "price_band",
            "average_rating",
            "total_reviews",
            "total_completed_orders",
            "distance_km",
            "location",
            "categories",
            "bio",
            "is_verified",
            "average_response_time_minutes",
        ]

    def get_location(self, obj):
        """Convert Point to GeoJSON format"""
        if obj.location:
            return {
                "type": "Point",
                "coordinates": [obj.location.x, obj.location.y]
            }
        return None
