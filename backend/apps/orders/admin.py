from django.contrib import admin

from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "get_cliente",
        "get_proveedor",
        "get_servicio",
        "status",
        "amount",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = [
        "id",
        "job_request__user__email",
        "job_request__user__first_name",
        "job_request__guest_name",
        "match__provider__user__first_name",
        "match__provider__user__last_name",
    ]
    raw_id_fields = ["job_request", "match"]
    readonly_fields = ["created_at", "updated_at", "started_at", "completed_at", "cancelled_at"]
    date_hierarchy = "created_at"
    list_per_page = 25

    fieldsets = (
        (
            "Orden",
            {"fields": ("job_request", "match", "status", "amount", "payment_ref")},
        ),
        (
            "Fechas",
            {
                "fields": ("scheduled_at", "started_at", "completed_at", "cancelled_at", "cancellation_reason"),
            },
        ),
        (
            "Registro",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_cliente(self, obj):
        jr = obj.job_request
        if jr.user:
            name = jr.user.get_full_name() or jr.user.email
        else:
            name = jr.guest_name or jr.guest_email or "Invitado"
        return name
    get_cliente.short_description = "Cliente"

    def get_proveedor(self, obj):
        name = obj.match.provider.user.get_full_name()
        return name if name.strip() else obj.match.provider.user.email
    get_proveedor.short_description = "Proveedor"

    def get_servicio(self, obj):
        return obj.job_request.service.name
    get_servicio.short_description = "Servicio"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "job_request__user",
                "job_request__service",
                "match__provider__user",
            )
        )

    actions = ["marcar_completadas", "marcar_canceladas"]

    @admin.action(description="Marcar como completadas")
    def marcar_completadas(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status__in=["created", "paid", "in_progress"]).update(
            status="completed", completed_at=timezone.now()
        )
        self.message_user(request, f"{updated} orden(es) completada(s).")

    @admin.action(description="Marcar como canceladas")
    def marcar_canceladas(self, request, queryset):
        from django.utils import timezone
        updated = queryset.exclude(status__in=["completed", "cancelled"]).update(
            status="cancelled", cancelled_at=timezone.now()
        )
        self.message_user(request, f"{updated} orden(es) cancelada(s).")
