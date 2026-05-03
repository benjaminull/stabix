"""
Order views
"""

import logging

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsProvider

from .models import Order
from .serializers import OrderCreateSerializer, OrderListSerializer, OrderSerializer

logger = logging.getLogger(__name__)


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

    # Sync appointment status with order status
    ORDER_TO_APPOINTMENT_STATUS = {
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled',
    }
    apt_status = ORDER_TO_APPOINTMENT_STATUS.get(new_status)
    if apt_status and hasattr(order, 'appointment'):
        order.appointment.status = apt_status
        order.appointment.save(update_fields=['status', 'updated_at'])

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


@extend_schema(
    tags=["Payments"],
    description="Create MercadoPago payment preference for an order",
    responses={200: {"type": "object", "properties": {
        "init_point": {"type": "string"},
        "sandbox_init_point": {"type": "string"},
    }}},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_preference(request, pk):
    """POST /api/v1/customer/orders/<id>/pay/"""
    from .payment import create_preference

    try:
        order = Order.objects.get(pk=pk, job_request__user=request.user)
    except Order.DoesNotExist:
        return Response(
            {"error": "Orden no encontrada"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if order.status != "created":
        return Response(
            {"error": "Esta orden ya fue pagada o no está disponible para pago"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        data = create_preference(order)
    except Exception as e:
        logger.exception("Error creating MP preference for order %s", pk)
        return Response(
            {"error": "No se pudo crear la preferencia de pago"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(data)


@extend_schema(
    tags=["Payments"],
    description="MercadoPago webhook endpoint",
)
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def mercadopago_webhook(request):
    """POST /api/v1/payments/webhook/"""
    from .payment import verify_payment

    topic = request.query_params.get("type") or request.data.get("type")

    if topic == "payment":
        data_id = (
            request.query_params.get("data.id")
            or request.data.get("data", {}).get("id")
        )
        if not data_id:
            return Response({"status": "ok"})

        try:
            payment_info = verify_payment(data_id)
        except Exception:
            logger.exception("Error verifying MP payment %s", data_id)
            return Response({"status": "ok"})

        if payment_info["status"] == "approved":
            external_ref = payment_info["external_reference"]
            try:
                order = Order.objects.get(pk=int(external_ref))
            except (Order.DoesNotExist, ValueError, TypeError):
                logger.warning("Order not found for external_reference: %s", external_ref)
                return Response({"status": "ok"})

            if order.status != "paid":
                order.status = "paid"
                order.payment_ref = payment_info["payment_id"]
                order.save(update_fields=["status", "payment_ref", "updated_at"])
                logger.info("Order %s marked as paid (payment %s)", order.id, data_id)

    return Response({"status": "ok"})
