"""
API v1 URL router - centralizes all API endpoints
"""

from django.urls import include, path

urlpatterns = [
    path("auth/", include("stabix_backend.api.v1.auth")),
    path("public/", include("stabix_backend.api.v1.public")),
    path("customer/", include("stabix_backend.api.v1.customer")),
    path("provider/", include("stabix_backend.api.v1.provider")),
    path("common/", include("stabix_backend.api.v1.common")),
]
