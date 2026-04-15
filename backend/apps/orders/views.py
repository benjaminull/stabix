"""
Order views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsProvider

from .models import Order
from .serializers import OrderCreateSerializer, OrderListSerializer, OrderSerializer


@extend_schema_view(
    post=extend_schema(tags=["Orders"], description="Create a new order from accepted match"),
    get=extend_schema(tags=["Orders"], description="List user's orders"),
)
class OrderListCreateView(generics.ListCreateAPIView):
    """List and create orders"""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderListSerializer

    def get_queryset(self):
        user = self.request.user
        # Show orders where user is either customer or provider
        return Order.objects.filter(
            job_request__user=user
        ) | Order.objects.filter(match__provider__user=user)


@extend_schema_view(
    get=extend_schema(tags=["Orders"], description="Get order details")
)
class OrderDetailView(generics.RetrieveAPIView):
    """Order detail view"""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Show orders where user is either customer or provider
        return (
            Order.objects.filter(job_request__user=user)
            | Order.objects.filter(match__provider__user=user)
        ).select_related("job_request", "match__provider__user")


@extend_schema_view(
    get=extend_schema(tags=["Provider Orders"], description="List provider's orders")
)
class ProviderOrderListView(generics.ListAPIView):
    """List orders for the current provider"""

    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated, IsProvider]

    def get_queryset(self):
        from apps.users.models import ProviderProfile

        provider = ProviderProfile.objects.get(user=self.request.user)

        queryset = Order.objects.filter(
            match__provider=provider
        ).select_related(
            "job_request__service",
            "job_request__user",
            "match"
        ).order_by('-created_at')

        # Filtro por estado
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


@extend_schema(
    tags=["Provider Orders"],
    description="Update order status (provider only)",
    request={'new_status': str},
    responses={200: OrderSerializer},
)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsProvider])
def update_order_status(request, pk):
    """
    PATCH /api/v1/provider/orders/{id}/status/
    Actualiza el estado de una orden (solo proveedor)
    """
    from apps.users.models import ProviderProfile
    from apps.notifications.utils import notify_order_updated, notify_order_completed
    from django.utils import timezone

    try:
        provider = ProviderProfile.objects.get(user=request.user)
        order = Order.objects.get(pk=pk, match__provider=provider)
    except (ProviderProfile.DoesNotExist, Order.DoesNotExist):
        return Response(
            {"error": "Orden no encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('new_status')
    if not new_status:
        return Response(
            {"error": "El campo 'new_status' es requerido"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validar transiciones de estado
    valid_transitions = {
        'created': ['paid', 'cancelled'],
        'paid': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
    }

    if new_status not in valid_transitions.get(order.status, []):
        return Response(
            {"error": f"No se puede cambiar de '{order.status}' a '{new_status}'"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Actualizar estado
    old_status = order.status
    order.status = new_status

    # Actualizar timestamps según estado
    if new_status == 'in_progress' and not order.started_at:
        order.started_at = timezone.now()
    elif new_status == 'completed' and not order.completed_at:
        order.completed_at = timezone.now()

    order.save()

    # Crear notificaciones
    customer = order.job_request.user
    if new_status == 'completed':
        notify_order_completed(customer, order)
    else:
        status_messages = {
            'in_progress': 'Tu orden está en progreso',
            'paid': 'El pago de tu orden fue confirmado',
            'cancelled': 'Tu orden fue cancelada',
        }
        if new_status in status_messages:
            notify_order_updated(customer, order, status_messages[new_status])

    serializer = OrderSerializer(order)
    return Response(serializer.data)
