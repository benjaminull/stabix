"""
URL configuration for appointments app
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.appointments import views

router = DefaultRouter()
router.register(r"working-hours", views.WorkingHoursViewSet, basename="working-hours")
router.register(r"appointments", views.AppointmentViewSet, basename="appointments")
router.register(r"proposals", views.TimeSlotProposalViewSet, basename="proposals")

urlpatterns = [
    path("", include(router.urls)),
]
