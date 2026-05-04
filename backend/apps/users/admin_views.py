"""
Admin API views — staff-only endpoints for managing the platform.
"""

import secrets
import string
from datetime import time

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.appointments.models import WorkingHours
from apps.jobs.models import Match
from apps.listings.models import Listing
from apps.orders.models import Order
from apps.taxonomy.models import Service, ServiceCategory

from .models import ProviderProfile
from .permissions import IsStaff

User = get_user_model()


# ── Serializers ──────────────────────────────────────────────


class AdminProviderListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    categories = serializers.SerializerMethodField()
    listings_count = serializers.IntegerField(read_only=True)
    orders_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "categories",
            "price_band",
            "is_active",
            "is_verified",
            "average_rating",
            "total_reviews",
            "total_completed_orders",
            "listings_count",
            "orders_count",
            "created_at",
        ]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_categories(self, obj):
        return [{"id": c.id, "name": c.name} for c in obj.categories.all()]


class AdminProviderDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    categories = serializers.SerializerMethodField()
    listings = serializers.SerializerMethodField()
    location_lat = serializers.SerializerMethodField()
    location_lng = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = [
            "id",
            "name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "bio",
            "categories",
            "price_band",
            "radius_km",
            "is_active",
            "is_verified",
            "average_rating",
            "total_reviews",
            "total_completed_orders",
            "listings",
            "location_lat",
            "location_lng",
            "created_at",
        ]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_categories(self, obj):
        return [{"id": c.id, "name": c.name} for c in obj.categories.all()]

    def get_listings(self, obj):
        return list(
            obj.listings.values("id", "title", "base_price", "price_unit", "is_active", "service__name")
        )

    def get_location_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_location_lng(self, obj):
        return obj.location.x if obj.location else None


class AdminProviderUpdateSerializer(serializers.Serializer):
    is_active = serializers.BooleanField(required=False)
    is_verified = serializers.BooleanField(required=False)
    price_band = serializers.ChoiceField(
        choices=["budget", "standard", "premium", "luxury"], required=False
    )
    bio = serializers.CharField(required=False, allow_blank=True)
    radius_km = serializers.FloatField(required=False)
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    location_lat = serializers.FloatField(required=False)
    location_lng = serializers.FloatField(required=False)


class AdminCategorySerializer(serializers.ModelSerializer):
    services_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "icon", "is_active", "order", "services_count"]


class AdminServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "slug", "category", "category_name", "is_active", "order"]


class AdminOrderSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "client_name",
            "provider_name",
            "service_name",
            "status",
            "amount",
            "created_at",
            "completed_at",
            "cancelled_at",
        ]

    def get_client_name(self, obj):
        jr = obj.job_request
        if jr.user:
            return jr.user.get_full_name() or jr.user.email
        return jr.guest_name or jr.guest_email or "Invitado"

    def get_provider_name(self, obj):
        return obj.match.provider.user.get_full_name() or obj.match.provider.user.email

    def get_service_name(self, obj):
        return obj.job_request.service.name


# ── Views ────────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_stats(request):
    """Dashboard stats overview."""
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_providers = ProviderProfile.objects.count()
    active_providers = ProviderProfile.objects.filter(is_active=True).count()
    total_orders = Order.objects.count()
    orders_this_month = Order.objects.filter(created_at__gte=month_start).count()
    revenue_this_month = (
        Order.objects.filter(created_at__gte=month_start, status="completed").aggregate(
            total=Sum("amount")
        )["total"]
        or 0
    )
    pending_matches = Match.objects.filter(status="pending").count()

    return Response(
        {
            "total_providers": total_providers,
            "active_providers": active_providers,
            "total_orders": total_orders,
            "orders_this_month": orders_this_month,
            "revenue_this_month": float(revenue_this_month),
            "pending_matches": pending_matches,
        }
    )


class AdminProviderListView(generics.ListAPIView):
    """List all providers with counts."""

    serializer_class = AdminProviderListSerializer
    permission_classes = [IsAuthenticated, IsStaff]

    def get_queryset(self):
        qs = (
            ProviderProfile.objects.select_related("user")
            .prefetch_related("categories")
            .annotate(
                listings_count=Count("listings", distinct=True),
                orders_count=Count("matches__order", distinct=True),
            )
            .order_by("-created_at")
        )

        # Filters
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")

        is_verified = self.request.query_params.get("is_verified")
        if is_verified is not None:
            qs = qs.filter(is_verified=is_verified.lower() == "true")

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__phone__icontains=search)
            )

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(categories__id=category)

        return qs


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_provider_detail(request, pk):
    """Get provider detail."""
    try:
        provider = (
            ProviderProfile.objects.select_related("user")
            .prefetch_related("categories", "listings__service")
            .get(pk=pk)
        )
    except ProviderProfile.DoesNotExist:
        return Response({"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminProviderDetailSerializer(provider)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_provider_update(request, pk):
    """Update provider fields."""
    try:
        provider = ProviderProfile.objects.select_related("user").get(pk=pk)
    except ProviderProfile.DoesNotExist:
        return Response({"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    serializer = AdminProviderUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Update user fields
    user = provider.user
    if "first_name" in data:
        user.first_name = data["first_name"]
    if "last_name" in data:
        user.last_name = data["last_name"]
    if "phone" in data:
        user.phone = data["phone"]
    user_fields = [f for f in ["first_name", "last_name", "phone"] if f in data]
    if user_fields:
        user.save(update_fields=user_fields)

    # Update provider fields
    for field in ["is_active", "is_verified", "price_band", "bio", "radius_km"]:
        if field in data:
            setattr(provider, field, data[field])

    if "location_lat" in data and "location_lng" in data:
        provider.location = Point(data["location_lng"], data["location_lat"], srid=4326)

    if "category_ids" in data:
        provider.categories.set(data["category_ids"])

    provider.save()

    detail_serializer = AdminProviderDetailSerializer(provider)
    return Response(detail_serializer.data)


class AdminCategoryListView(generics.ListAPIView):
    """List categories with service counts."""

    serializer_class = AdminCategorySerializer
    permission_classes = [IsAuthenticated, IsStaff]
    pagination_class = None

    def get_queryset(self):
        return ServiceCategory.objects.annotate(
            services_count=Count("services")
        ).order_by("order", "name")


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_category_update(request, pk):
    """Update category."""
    try:
        category = ServiceCategory.objects.get(pk=pk)
    except ServiceCategory.DoesNotExist:
        return Response({"error": "Categoria no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    for field in ["name", "icon", "is_active", "order"]:
        if field in request.data:
            setattr(category, field, request.data[field])
    category.save()

    serializer = AdminCategorySerializer(category)
    return Response(serializer.data)


class AdminServiceListView(generics.ListAPIView):
    """List services."""

    serializer_class = AdminServiceSerializer
    permission_classes = [IsAuthenticated, IsStaff]
    pagination_class = None

    def get_queryset(self):
        qs = Service.objects.select_related("category").order_by("category__order", "order", "name")
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category_id=category)
        return qs


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_service_update(request, pk):
    """Update service."""
    try:
        service = Service.objects.select_related("category").get(pk=pk)
    except Service.DoesNotExist:
        return Response({"error": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    for field in ["name", "is_active", "order"]:
        if field in request.data:
            setattr(service, field, request.data[field])
    service.save()

    serializer = AdminServiceSerializer(service)
    return Response(serializer.data)


class AdminOrderListView(generics.ListAPIView):
    """List all orders."""

    serializer_class = AdminOrderSerializer
    permission_classes = [IsAuthenticated, IsStaff]

    def get_queryset(self):
        qs = Order.objects.select_related(
            "job_request__user",
            "job_request__service",
            "match__provider__user",
        ).order_by("-created_at")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(job_request__user__first_name__icontains=search)
                | Q(job_request__user__email__icontains=search)
                | Q(job_request__guest_name__icontains=search)
                | Q(match__provider__user__first_name__icontains=search)
            )

        return qs


# ── Provider Create ──────────────────────────────────────


def _generate_password(length=12):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class AdminProviderCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    password = serializers.CharField(required=False, allow_blank=True, default="")
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    price_band = serializers.ChoiceField(
        choices=["budget", "standard", "premium", "luxury"], default="standard"
    )
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    location_lat = serializers.FloatField(required=False, default=None)
    location_lng = serializers.FloatField(required=False, default=None)
    radius_km = serializers.FloatField(required=False, default=15.0)


def _create_default_working_hours(provider):
    """Create Mon-Fri 9:00-13:00 and 14:00-18:00 blocks."""
    hours = []
    for weekday in range(5):  # Mon-Fri
        hours.append(WorkingHours(provider=provider, weekday=weekday, start_time=time(9, 0), end_time=time(13, 0)))
        hours.append(WorkingHours(provider=provider, weekday=weekday, start_time=time(14, 0), end_time=time(18, 0)))
    WorkingHours.objects.bulk_create(hours)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_provider_create(request):
    """Create a new provider (user + profile + default working hours)."""
    serializer = AdminProviderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if User.objects.filter(email=data["email"]).exists():
        return Response({"error": "Ya existe un usuario con ese email"}, status=status.HTTP_400_BAD_REQUEST)

    password = data["password"] or _generate_password()

    with transaction.atomic():
        user = User.objects.create_user(
            username=data["email"],
            email=data["email"],
            password=password,
            first_name=data["first_name"],
            last_name=data["last_name"],
            phone=data["phone"] or None,
            is_provider=True,
        )

        location = None
        if data.get("location_lat") is not None and data.get("location_lng") is not None:
            location = Point(data["location_lng"], data["location_lat"], srid=4326)

        provider = ProviderProfile.objects.create(
            user=user,
            bio=data["bio"],
            price_band=data["price_band"],
            location=location,
            radius_km=data["radius_km"],
            is_active=True,
            is_verified=False,
        )

        if data["category_ids"]:
            valid_ids = list(ServiceCategory.objects.filter(id__in=data["category_ids"]).values_list("id", flat=True))
            provider.categories.set(valid_ids)

        _create_default_working_hours(provider)

    detail_serializer = AdminProviderDetailSerializer(provider)
    response_data = detail_serializer.data
    response_data["generated_password"] = password

    return Response(response_data, status=status.HTTP_201_CREATED)


# ── Provider Listings ────────────────────────────────────


class AdminListingCreateSerializer(serializers.Serializer):
    provider_id = serializers.IntegerField()
    service_id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, default="")
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    price_unit = serializers.CharField(default="fixed")
    estimated_duration_minutes = serializers.IntegerField(default=60)
    is_active = serializers.BooleanField(default=True)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_listing_create(request):
    """Create a listing for a provider."""
    serializer = AdminListingCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        provider = ProviderProfile.objects.get(pk=data["provider_id"])
    except ProviderProfile.DoesNotExist:
        return Response({"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    try:
        service = Service.objects.get(pk=data["service_id"])
    except Service.DoesNotExist:
        return Response({"error": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    listing = Listing.objects.create(
        provider=provider,
        service=service,
        title=data["title"],
        description=data["description"],
        base_price=data["base_price"],
        price_unit=data["price_unit"],
        estimated_duration_minutes=data["estimated_duration_minutes"],
        is_active=data["is_active"],
    )

    return Response(
        {
            "id": listing.id,
            "title": listing.title,
            "base_price": str(listing.base_price),
            "price_unit": listing.price_unit,
            "is_active": listing.is_active,
            "service__name": service.name,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_listing_delete(request, pk):
    """Delete a listing."""
    try:
        listing = Listing.objects.get(pk=pk)
    except Listing.DoesNotExist:
        return Response({"error": "Listing no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    listing.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Working Hours ────────────────────────────────────────


class WorkingHourSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingHours
        fields = ["id", "weekday", "start_time", "end_time", "is_active"]


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated, IsStaff])
def admin_provider_working_hours(request, pk):
    """Get or update provider working hours."""
    try:
        provider = ProviderProfile.objects.get(pk=pk)
    except ProviderProfile.DoesNotExist:
        return Response({"error": "Proveedor no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        hours = provider.working_hours.all().order_by("weekday", "start_time")
        serializer = WorkingHourSerializer(hours, many=True)
        return Response(serializer.data)

    # PUT — replace all working hours
    serializer = WorkingHourSerializer(data=request.data, many=True)
    serializer.is_valid(raise_exception=True)

    with transaction.atomic():
        provider.working_hours.all().delete()
        hours = []
        for item in serializer.validated_data:
            hours.append(
                WorkingHours(
                    provider=provider,
                    weekday=item["weekday"],
                    start_time=item["start_time"],
                    end_time=item["end_time"],
                    is_active=item.get("is_active", True),
                )
            )
        WorkingHours.objects.bulk_create(hours)

    result = provider.working_hours.all().order_by("weekday", "start_time")
    return Response(WorkingHourSerializer(result, many=True).data)
