from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import JobRequest, Match


@admin.register(JobRequest)
class JobRequestAdmin(GISModelAdmin):
    list_display = ["id", "get_cliente", "service", "status", "preferred_date", "created_at"]
    list_filter = ["status", "service__category", "created_at"]
    search_fields = ["user__email", "user__first_name", "guest_name", "guest_email", "details"]
    raw_id_fields = ["user", "service", "target_provider", "target_listing"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

    def get_cliente(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return obj.guest_name or obj.guest_email or "Invitado"
    get_cliente.short_description = "Cliente"


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ["id", "job_request", "get_proveedor", "status", "score", "price_quote", "created_at"]
    list_filter = ["status"]
    search_fields = ["job_request__id", "provider__user__email", "provider__user__first_name"]
    raw_id_fields = ["job_request", "provider"]
    readonly_fields = ["created_at", "updated_at"]

    def get_proveedor(self, obj):
        name = obj.provider.user.get_full_name()
        return name if name.strip() else obj.provider.user.email
    get_proveedor.short_description = "Proveedor"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("provider__user", "job_request")
