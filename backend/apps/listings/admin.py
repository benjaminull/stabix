from django.contrib import admin

from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "get_proveedor",
        "service",
        "base_price",
        "price_unit",
        "estimated_duration_minutes",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "service__category", "price_unit"]
    search_fields = ["title", "description", "provider__user__first_name", "provider__user__last_name"]
    raw_id_fields = ["provider", "service"]
    list_editable = ["is_active", "base_price"]

    def get_proveedor(self, obj):
        name = obj.provider.user.get_full_name()
        return name if name.strip() else obj.provider.user.email
    get_proveedor.short_description = "Proveedor"
    get_proveedor.admin_order_field = "provider__user__first_name"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("provider__user", "service__category")
