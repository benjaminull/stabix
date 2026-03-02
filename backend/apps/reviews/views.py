"""
Review views
"""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order

from .models import Review
from .serializers import ReviewListSerializer, ReviewSerializer


@extend_schema_view(
    post=extend_schema(tags=["Reviews"], description="Create a review for an order")
)
class OrderReviewCreateView(generics.CreateAPIView):
    """Create a review for an order"""

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        order_id = self.kwargs["order_id"]

        try:
            order = Order.objects.get(pk=order_id, job_request__user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found or you don't have permission"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(order=order)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(tags=["Reviews"], description="List reviews for a provider")
)
class ProviderReviewListView(generics.ListAPIView):
    """List reviews for a provider"""

    serializer_class = ReviewListSerializer

    def get_queryset(self):
        provider_id = self.kwargs["provider_id"]
        return Review.objects.filter(
            order__match__provider_id=provider_id, is_public=True
        ).select_related("order__job_request__user")
