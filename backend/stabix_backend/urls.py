"""
URL configuration for stabix_backend project.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # API endpoints
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.taxonomy.urls")),
    path("api/", include("apps.listings.urls")),
    path("api/", include("apps.jobs.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/", include("apps.reviews.urls")),
    path("api/", include("apps.chat.urls")),
]
