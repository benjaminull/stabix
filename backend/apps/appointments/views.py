"""
Views for appointment endpoints
"""

from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.appointments.models import Appointment, TimeSlotProposal, WorkingHours
from apps.appointments.serializers import (
    AppointmentSerializer,
    TimeSlotProposalResponseSerializer,
    TimeSlotProposalSerializer,
    WorkingHoursSerializer,
)


class WorkingHoursViewSet(viewsets.ModelViewSet):
    """
    ViewSet for provider working hours
    """

    serializer_class = WorkingHoursSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get working hours for current provider"""
        if not self.request.user.is_provider:
            return WorkingHours.objects.none()
        return WorkingHours.objects.filter(
            provider=self.request.user.provider_profile
        ).order_by("weekday", "start_time")

    def perform_create(self, serializer):
        """Set provider from current user"""
        serializer.save(provider=self.request.user.provider_profile)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for appointments/calendar
    """

    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get appointments for current provider"""
        if not self.request.user.is_provider:
            return Appointment.objects.none()

        queryset = Appointment.objects.filter(
            provider=self.request.user.provider_profile
        ).select_related("order", "order__job_request", "order__job_request__user")

        # Filter by date range (for calendar view)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if start_date and end_date:
            try:
                start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                queryset = queryset.filter(
                    start_datetime__gte=start, start_datetime__lte=end
                )
            except ValueError:
                pass

        # Filter by status
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by appointment type
        type_filter = self.request.query_params.get("type")
        if type_filter:
            queryset = queryset.filter(appointment_type=type_filter)

        return queryset.order_by("start_datetime")

    def perform_create(self, serializer):
        """Set provider from current user"""
        serializer.save(provider=self.request.user.provider_profile)

    @action(detail=False, methods=["get"])
    def calendar_view(self, request):
        """
        Get calendar view data for a specific week/month
        Returns appointments grouped by day
        """
        # Get date range (default: current week)
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            # Default to current week
            today = timezone.now().date()
            start_of_week = today - timedelta(days=today.weekday())
            start_date = start_of_week.isoformat()
            end_date = (start_of_week + timedelta(days=6)).isoformat()

        queryset = self.get_queryset().filter(
            start_datetime__date__gte=start_date,
            start_datetime__date__lte=end_date,
        )

        # Group by date
        appointments_by_date = {}
        for appointment in queryset:
            date_key = appointment.start_datetime.date().isoformat()
            if date_key not in appointments_by_date:
                appointments_by_date[date_key] = []
            appointments_by_date[date_key].append(
                AppointmentSerializer(appointment).data
            )

        return Response(
            {
                "start_date": start_date,
                "end_date": end_date,
                "appointments_by_date": appointments_by_date,
                "total_appointments": queryset.count(),
            }
        )

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        """Update appointment status"""
        appointment = self.get_object()
        new_status = request.data.get("status")

        if not new_status:
            return Response(
                {"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in dict(Appointment.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = new_status
        appointment.save()

        return Response(AppointmentSerializer(appointment).data)


class TimeSlotProposalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for time slot proposals
    """

    serializer_class = TimeSlotProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get proposals for current user (customer or provider)"""
        user = self.request.user

        if user.is_provider:
            # Provider sees proposals sent to them
            queryset = TimeSlotProposal.objects.filter(
                provider=user.provider_profile
            ).select_related("job_request", "job_request__user", "job_request__service")
        else:
            # Customer sees their own proposals
            queryset = TimeSlotProposal.objects.filter(
                job_request__user=user
            ).select_related("provider", "provider__user", "job_request__service")

        # Filter by status
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by("-created_at")

    @action(detail=True, methods=["post"])
    def respond(self, request, pk=None):
        """
        Provider responds to a time slot proposal
        Either accepts and selects a time, or rejects
        """
        proposal = self.get_object()

        # Verify it's the provider responding
        if not request.user.is_provider:
            return Response(
                {"error": "Only providers can respond to proposals"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if proposal.provider != request.user.provider_profile:
            return Response(
                {"error": "This proposal is not for you"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if already responded
        if proposal.status != "pending":
            return Response(
                {"error": f"Proposal already {proposal.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if expired
        if proposal.expires_at and proposal.expires_at < timezone.now():
            proposal.status = "expired"
            proposal.save()
            return Response(
                {"error": "Proposal has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate response
        serializer = TimeSlotProposalResponseSerializer(
            data=request.data, context={"proposal": proposal}
        )
        serializer.is_valid(raise_exception=True)

        # Update proposal
        if serializer.validated_data.get("accept", True):
            proposal.status = "accepted"
            proposal.selected_datetime = serializer.validated_data["selected_datetime"]
            proposal.provider_notes = serializer.validated_data.get("provider_notes", "")
            proposal.responded_at = timezone.now()
            proposal.save()

            # Create appointment from accepted proposal
            appointment = Appointment.objects.create(
                provider=proposal.provider,
                appointment_type="order",
                status="scheduled",
                start_datetime=proposal.selected_datetime,
                end_datetime=proposal.selected_datetime
                + timedelta(minutes=proposal.duration_minutes),
                duration_minutes=proposal.duration_minutes,
                notes=f"Created from time slot proposal #{proposal.id}",
            )

            return Response(
                {
                    "message": "Proposal accepted",
                    "proposal": TimeSlotProposalSerializer(proposal).data,
                    "appointment": AppointmentSerializer(appointment).data,
                }
            )
        else:
            proposal.status = "rejected"
            proposal.provider_notes = serializer.validated_data.get("provider_notes", "")
            proposal.responded_at = timezone.now()
            proposal.save()

            return Response(
                {
                    "message": "Proposal rejected",
                    "proposal": TimeSlotProposalSerializer(proposal).data,
                }
            )

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get all pending proposals for provider"""
        if not request.user.is_provider:
            return Response(
                {"error": "Only providers can view pending proposals"},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset().filter(status="pending", expires_at__gt=timezone.now())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
