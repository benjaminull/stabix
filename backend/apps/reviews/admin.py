from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["id", "get_cliente", "get_proveedor", "rating", "is_public", "created_at"]
    list_filter = ["rating", "is_public", "created_at"]
    search_fields = ["order__job_request__user__first_name", "order__match__provider__user__first_name", "comment"]
    raw_id_fields = ["order"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

    def get_cliente(self, obj):
        jr = obj.order.job_request
        if jr.user:
            return jr.user.get_full_name() or jr.user.email
        return jr.guest_name or "Invitado"
    get_cliente.short_description = "Cliente"

    def get_proveedor(self, obj):
        name = obj.order.match.provider.user.get_full_name()
        return name if name.strip() else obj.order.match.provider.user.email
    get_proveedor.short_description = "Proveedor"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("order__job_request__user", "order__match__provider__user")
        )
