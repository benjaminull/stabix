"""
Taxonomy URLs
"""

from django.urls import path

from .views import ServiceCategoryListView, ServiceListView

urlpatterns = [
    path("categories/", ServiceCategoryListView.as_view(), name="category_list"),
    path("services/", ServiceListView.as_view(), name="service_list"),
]
