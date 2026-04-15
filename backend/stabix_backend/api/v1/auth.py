"""
Auth URL patterns: login, refresh, register
"""

from django.urls import path

from apps.users.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    UserRegistrationView,
)

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("register/", UserRegistrationView.as_view(), name="user_register"),
]
