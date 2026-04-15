"""
User views and authentication endpoints
"""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import ProviderProfile
from .permissions import IsProvider
from .serializers import (
    ProviderProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

User = get_user_model()


@extend_schema(tags=["Authentication"])
class CustomTokenObtainPairView(TokenObtainPairView):
    """Obtain JWT token pair"""

    pass


@extend_schema(tags=["Authentication"])
class CustomTokenRefreshView(TokenRefreshView):
    """Refresh JWT access token"""

    pass


@extend_schema(tags=["Authentication"])
class UserRegistrationView(generics.CreateAPIView):
    """Register a new user"""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    get=extend_schema(tags=["Authentication"], description="Get current user profile"),
    put=extend_schema(tags=["Authentication"], description="Update current user profile"),
    patch=extend_schema(tags=["Authentication"], description="Partially update current user profile"),
)
class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile"""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema_view(
    get=extend_schema(tags=["Providers"], description="Get provider profile"),
    put=extend_schema(tags=["Providers"], description="Update provider profile"),
    patch=extend_schema(tags=["Providers"], description="Partially update provider profile"),
)
class ProviderProfileDetailView(generics.RetrieveUpdateAPIView):
    """Provider profile detail and update"""

    queryset = ProviderProfile.objects.all()
    serializer_class = ProviderProfileSerializer
    permission_classes = [IsAuthenticated, IsProvider]

    def get_object(self):
        # Return the provider profile for the current user
        return ProviderProfile.objects.get(user=self.request.user)


@extend_schema(tags=["Provider Dashboard"])
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsProvider])
def provider_dashboard(request):
    """
    GET /api/v1/provider/dashboard/
    Obtiene estadísticas y datos del dashboard del proveedor
    """
    from django.db.models import Count, Avg, Sum, Q
    from apps.jobs.models import Match
    from apps.orders.models import Order
    from django.utils import timezone
    from datetime import timedelta

    try:
        provider = ProviderProfile.objects.get(user=request.user)
    except ProviderProfile.DoesNotExist:
        return Response(
            {"error": "Perfil de proveedor no encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Estadísticas de matches
    pending_matches = Match.objects.filter(
        provider=provider,
        status='pending'
    ).count()

    total_matches = Match.objects.filter(provider=provider).count()

    # Estadísticas de órdenes
    orders_stats = Order.objects.filter(
        match__provider=provider
    ).aggregate(
        total_orders=Count('id'),
        completed_orders=Count('id', filter=Q(status='completed')),
        in_progress_orders=Count('id', filter=Q(status='in_progress')),
        total_revenue=Sum('amount', filter=Q(status='completed')),
    )

    # Órdenes activas (próximas y en progreso)
    now = timezone.now()
    upcoming_orders = Order.objects.filter(
        match__provider=provider,
        status__in=['created', 'paid', 'in_progress'],
        scheduled_at__gte=now
    ).select_related(
        'job_request__service',
        'job_request__user'
    ).order_by('scheduled_at')[:5]

    # Órdenes recientes
    recent_orders = Order.objects.filter(
        match__provider=provider
    ).select_related(
        'job_request__service',
        'job_request__user'
    ).order_by('-created_at')[:10]

    # Revenue de los últimos 30 días
    thirty_days_ago = now - timedelta(days=30)
    recent_revenue = Order.objects.filter(
        match__provider=provider,
        status='completed',
        completed_at__gte=thirty_days_ago
    ).aggregate(
        total=Sum('amount')
    )['total'] or 0

    # Serializar órdenes próximas
    from apps.orders.serializers import OrderSerializer
    upcoming_orders_data = OrderSerializer(upcoming_orders, many=True).data
    recent_orders_data = OrderSerializer(recent_orders, many=True).data

    return Response({
        'provider': ProviderProfileSerializer(provider).data,
        'stats': {
            'pending_matches': pending_matches,
            'total_matches': total_matches,
            'total_orders': orders_stats['total_orders'] or 0,
            'completed_orders': orders_stats['completed_orders'] or 0,
            'in_progress_orders': orders_stats['in_progress_orders'] or 0,
            'total_revenue': float(orders_stats['total_revenue'] or 0),
            'recent_revenue': float(recent_revenue),
            'average_rating': float(provider.average_rating or 0),
            'total_reviews': provider.total_reviews,
        },
        'upcoming_orders': upcoming_orders_data,
        'recent_orders': recent_orders_data,
    })


@extend_schema(tags=["Provider Dashboard"])
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated, IsProvider])
def update_availability(request):
    """
    PUT/PATCH /api/v1/provider/availability/
    Actualiza la disponibilidad del proveedor
    """
    try:
        provider = ProviderProfile.objects.get(user=request.user)
    except ProviderProfile.DoesNotExist:
        return Response(
            {"error": "Perfil de proveedor no encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Actualizar availability (JSONField)
    availability_data = request.data.get('availability')
    if availability_data is not None:
        provider.availability = availability_data
        provider.save(update_fields=['availability'])

    return Response({
        'message': 'Disponibilidad actualizada correctamente',
        'availability': provider.availability
    })
