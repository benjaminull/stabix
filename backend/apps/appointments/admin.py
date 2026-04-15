"""
Admin configuration for appointments app
"""

from django.contrib import admin

from apps.appointments.models import Appointment, TimeSlotProposal, WorkingHours


@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display = [
        "provider",
        "weekday_display",
        "start_time",
        "end_time",
        "is_active",
    ]
    list_filter = ["weekday", "is_active"]
    search_fields = ["provider__user__email"]
    ordering = ["provider", "weekday", "start_time"]

    def weekday_display(self, obj):
        return obj.get_weekday_display()

    weekday_display.short_description = "Day of Week"


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "provider",
        "appointment_type",
        "status",
        "start_datetime",
        "duration_minutes",
        "created_at",
    ]
    list_filter = ["appointment_type", "status", "start_datetime"]
    search_fields = ["provider__user__email", "client_name", "notes"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-start_datetime"]

    fieldsets = (
        (
            "Basic Info",
            {"fields": ("provider", "appointment_type", "status")},
        ),
        (
            "Scheduling",
            {
                "fields": (
                    "start_datetime",
                    "end_datetime",
                    "duration_minutes",
                )
            },
        ),
        (
            "Order Link",
            {"fields": ("order",), "classes": ("collapse",)},
        ),
        (
            "External Client Info",
            {
                "fields": ("client_name", "client_phone", "service_description"),
                "classes": ("collapse",),
            },
        ),
        (
            "Notes",
            {"fields": ("notes",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(TimeSlotProposal)
class TimeSlotProposalAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "job_request",
        "provider",
        "status",
        "proposed_datetime_1",
        "selected_datetime",
        "expires_at",
        "created_at",
    ]
    list_filter = ["status", "created_at", "expires_at"]
    search_fields = [
        "job_request__user__email",
        "provider__user__email",
        "provider_notes",
    ]
    readonly_fields = ["created_at", "updated_at", "responded_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "Basic Info",
            {"fields": ("job_request", "provider", "status")},
        ),
        (
            "Proposed Time Slots",
            {
                "fields": (
                    "proposed_datetime_1",
                    "proposed_datetime_2",
                    "proposed_datetime_3",
                    "duration_minutes",
                )
            },
        ),
        (
            "Provider Response",
            {
                "fields": (
                    "selected_datetime",
                    "provider_notes",
                    "responded_at",
                )
            },
        ),
        (
            "Expiration",
            {"fields": ("expires_at",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
