"""
Admin configuration for appointments app
"""

from django.contrib import admin

from apps.appointments.models import Appointment, TimeSlotProposal, WorkingHours


@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display = [
        "get_proveedor",
        "weekday_display",
        "start_time",
        "end_time",
        "is_active",
    ]
    list_filter = ["weekday", "is_active"]
    search_fields = ["provider__user__first_name", "provider__user__last_name", "provider__user__email"]
    ordering = ["provider", "weekday", "start_time"]
    list_editable = ["is_active"]

    DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]

    def weekday_display(self, obj):
        return self.DIAS[obj.weekday] if obj.weekday < len(self.DIAS) else obj.weekday
    weekday_display.short_description = "Dia"
    weekday_display.admin_order_field = "weekday"

    def get_proveedor(self, obj):
        name = obj.provider.user.get_full_name()
        return name if name.strip() else obj.provider.user.email
    get_proveedor.short_description = "Proveedor"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("provider__user")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "get_proveedor",
        "appointment_type",
        "status",
        "start_datetime",
        "duration_minutes",
        "created_at",
    ]
    list_filter = ["appointment_type", "status", "start_datetime"]
    search_fields = ["provider__user__first_name", "provider__user__last_name", "client_name"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-start_datetime"]
    date_hierarchy = "start_datetime"

    fieldsets = (
        (
            "Informacion General",
            {"fields": ("provider", "appointment_type", "status")},
        ),
        (
            "Horario",
            {"fields": ("start_datetime", "end_datetime", "duration_minutes")},
        ),
        (
            "Orden vinculada",
            {"fields": ("order",), "classes": ("collapse",)},
        ),
        (
            "Cliente externo",
            {
                "fields": ("client_name", "client_phone", "service_description"),
                "classes": ("collapse",),
            },
        ),
        (
            "Notas",
            {"fields": ("notes",)},
        ),
        (
            "Registro",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_proveedor(self, obj):
        name = obj.provider.user.get_full_name()
        return name if name.strip() else obj.provider.user.email
    get_proveedor.short_description = "Proveedor"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("provider__user")


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
    list_filter = ["status", "created_at"]
    search_fields = ["provider__user__first_name", "provider__user__email"]
    readonly_fields = ["created_at", "updated_at", "responded_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "Informacion",
            {"fields": ("job_request", "provider", "status")},
        ),
        (
            "Horarios propuestos",
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
            "Respuesta del proveedor",
            {"fields": ("selected_datetime", "provider_notes", "responded_at")},
        ),
        (
            "Expiracion",
            {"fields": ("expires_at",)},
        ),
        (
            "Registro",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
