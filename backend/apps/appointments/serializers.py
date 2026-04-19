"""
Serializers for appointment models
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.appointments.models import Appointment, TimeSlotProposal, WorkingHours


class WorkingHoursSerializer(serializers.ModelSerializer):
    """Serializer for provider working hours"""

    weekday_display = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = WorkingHours
        fields = [
            "id",
            "weekday",
            "weekday_display",
            "start_time",
            "end_time",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate that end_time is after start_time"""
        if data.get("start_time") and data.get("end_time"):
            if data["end_time"] <= data["start_time"]:
                raise serializers.ValidationError(
                    {"end_time": "End time must be after start time"}
                )
        return data


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for appointments"""

    appointment_type_display = serializers.CharField(
        source="get_appointment_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    client_info = serializers.SerializerMethodField()
    order_details = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "provider",
            "appointment_type",
            "appointment_type_display",
            "status",
            "status_display",
            "order",
            "order_details",
            "client_name",
            "client_phone",
            "client_info",
            "service_description",
            "start_datetime",
            "end_datetime",
            "duration_minutes",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "provider", "duration_minutes", "created_at", "updated_at"]

    def get_client_info(self, obj):
        """Get unified client info"""
        return obj.client

    def get_order_details(self, obj):
        """Get order details if linked"""
        if obj.order:
            return {
                "id": obj.order.id,
                "amount": str(obj.order.amount),
                "status": obj.order.status,
                "job_request_id": obj.order.job_request.id,
            }
        return None

    def validate(self, data):
        """Validate appointment data"""
        # Validate datetimes
        if data.get("start_datetime") and data.get("end_datetime"):
            if data["end_datetime"] <= data["start_datetime"]:
                raise serializers.ValidationError(
                    {"end_datetime": "End datetime must be after start datetime"}
                )

            # Calculate duration
            duration = (data["end_datetime"] - data["start_datetime"]).total_seconds() / 60
            data["duration_minutes"] = int(duration)

        # Validate appointment type requirements
        if data.get("appointment_type") == "order" and not data.get("order"):
            raise serializers.ValidationError(
                {"order": "Order is required for order-type appointments"}
            )

        if data.get("appointment_type") == "external":
            if not data.get("client_name"):
                raise serializers.ValidationError(
                    {"client_name": "Client name is required for external appointments"}
                )

        return data


class TimeSlotProposalSerializer(serializers.ModelSerializer):
    """Serializer for time slot proposals"""

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    customer_info = serializers.SerializerMethodField()
    job_request_details = serializers.SerializerMethodField()
    proposed_slots = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlotProposal
        fields = [
            "id",
            "job_request",
            "job_request_details",
            "provider",
            "customer_info",
            "proposed_datetime_1",
            "proposed_datetime_2",
            "proposed_datetime_3",
            "proposed_slots",
            "duration_minutes",
            "status",
            "status_display",
            "selected_datetime",
            "provider_notes",
            "responded_at",
            "expires_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "responded_at",
            "created_at",
            "updated_at",
        ]

    def get_customer_info(self, obj):
        """Get customer information"""
        return {
            "id": obj.customer.id,
            "name": obj.customer.get_full_name(),
            "email": obj.customer.email,
        }

    def get_job_request_details(self, obj):
        """Get job request details"""
        return {
            "id": obj.job_request.id,
            "service": obj.job_request.service.name if obj.job_request.service else None,
            "description": obj.job_request.description[:100],
            "estimated_budget": str(obj.job_request.estimated_budget),
        }

    def get_proposed_slots(self, obj):
        """Get all proposed time slots as a list"""
        slots = [obj.proposed_datetime_1]
        if obj.proposed_datetime_2:
            slots.append(obj.proposed_datetime_2)
        if obj.proposed_datetime_3:
            slots.append(obj.proposed_datetime_3)
        return slots

    def validate(self, data):
        """Validate time slot proposal"""
        # Ensure at least one proposed datetime
        if not data.get("proposed_datetime_1"):
            raise serializers.ValidationError(
                {"proposed_datetime_1": "At least one proposed time slot is required"}
            )

        # Ensure proposed times are in the future
        now = timezone.now()
        for field in ["proposed_datetime_1", "proposed_datetime_2", "proposed_datetime_3"]:
            if data.get(field) and data[field] <= now:
                raise serializers.ValidationError(
                    {field: "Proposed time must be in the future"}
                )

        # Auto-set expires_at if not provided (48 hours from now)
        if not data.get("expires_at"):
            data["expires_at"] = now + timedelta(hours=48)

        return data


class TimeSlotProposalResponseSerializer(serializers.Serializer):
    """Serializer for provider response to time slot proposal"""

    selected_datetime = serializers.DateTimeField(required=True)
    provider_notes = serializers.CharField(required=False, allow_blank=True)
    accept = serializers.BooleanField(default=True)

    def validate_selected_datetime(self, value):
        """Validate that selected datetime is one of the proposed ones"""
        proposal = self.context.get("proposal")
        if not proposal:
            raise serializers.ValidationError("Proposal context is required")

        valid_slots = [proposal.proposed_datetime_1]
        if proposal.proposed_datetime_2:
            valid_slots.append(proposal.proposed_datetime_2)
        if proposal.proposed_datetime_3:
            valid_slots.append(proposal.proposed_datetime_3)

        if value not in valid_slots:
            raise serializers.ValidationError(
                "Selected datetime must be one of the proposed time slots"
            )

        return value
