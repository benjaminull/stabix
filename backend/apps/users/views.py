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


@extend_schema(tags=["Authentication"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@extend_schema_view(
    get=extend_schema(tags=["Providers"], description="Get provider profile"),
    put=extend_schema(tags=["Providers"], description="Update provider profile"),
    patch=extend_schema(tags=["Providers"], description="Partially update provider profile"),
)
class ProviderProfileDetailView(generics.RetrieveUpdateAPIView):
    """Provider profile detail and update"""

    queryset = ProviderProfile.objects.all()
    serializer_class = ProviderProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the provider profile for the current user
        return ProviderProfile.objects.get(user=self.request.user)
