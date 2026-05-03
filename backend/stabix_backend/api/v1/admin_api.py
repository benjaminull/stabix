"""
Admin API URL patterns — staff-only endpoints.
"""

from django.urls import path

from apps.users.admin_views import (
    AdminCategoryListView,
    AdminOrderListView,
    AdminProviderListView,
    AdminServiceListView,
    admin_category_update,
    admin_provider_create,
    admin_provider_detail,
    admin_provider_update,
    admin_provider_working_hours,
    admin_service_update,
    admin_stats,
)

urlpatterns = [
    path("stats/", admin_stats, name="admin-stats"),
    path("providers/", AdminProviderListView.as_view(), name="admin-providers"),
    path("providers/create/", admin_provider_create, name="admin-provider-create"),
    path("providers/<int:pk>/", admin_provider_detail, name="admin-provider-detail"),
    path("providers/<int:pk>/update/", admin_provider_update, name="admin-provider-update"),
    path("providers/<int:pk>/working-hours/", admin_provider_working_hours, name="admin-provider-working-hours"),
    path("categories/", AdminCategoryListView.as_view(), name="admin-categories"),
    path("categories/<int:pk>/", admin_category_update, name="admin-category-update"),
    path("services/", AdminServiceListView.as_view(), name="admin-services"),
    path("services/<int:pk>/", admin_service_update, name="admin-service-update"),
    path("orders/", AdminOrderListView.as_view(), name="admin-orders"),
]
