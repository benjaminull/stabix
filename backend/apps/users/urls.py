"""
User and authentication URLs
"""

from django.urls import path

from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    ProviderProfileDetailView,
    UserRegistrationView,
    current_user,
)

urlpatterns = [
    # JWT Authentication
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    # User management
    path("register/", UserRegistrationView.as_view(), name="user_register"),
    path("me/", current_user, name="current_user"),
    # Provider profile
    path("provider/profile/", ProviderProfileDetailView.as_view(), name="provider_profile"),
]
