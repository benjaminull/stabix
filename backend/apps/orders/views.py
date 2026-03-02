"""
Order views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

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
