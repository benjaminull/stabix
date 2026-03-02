"""
Chat message views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order

from .models import Message
from .serializers import MessageSerializer


@extend_schema_view(
    get=extend_schema(tags=["Chat"], description="List messages for an order"),
    post=extend_schema(tags=["Chat"], description="Send a message in order chat"),
)
class OrderMessageListCreateView(generics.ListCreateAPIView):
    """List and create messages for an order"""

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        order_id = self.kwargs["order_id"]
        user = self.request.user

        # Verify user has access to this order
        try:
            order = Order.objects.get(pk=order_id)
            if order.customer != user and order.provider.user != user:
                return Message.objects.none()
        except Order.DoesNotExist:
            return Message.objects.none()

        return Message.objects.filter(order_id=order_id).select_related("sender")

    def create(self, request, *args, **kwargs):
        order_id = self.kwargs["order_id"]

        try:
            order = Order.objects.get(pk=order_id)
            # Verify user has access
            if order.customer != request.user and order.provider.user != request.user:
                return Response(
                    {"error": "You don't have permission to message in this order"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(order=order, sender=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
