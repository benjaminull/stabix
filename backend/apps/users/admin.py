from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.gis.admin import GISModelAdmin
from django.utils.html import format_html

from apps.listings.models import Listing
from apps.orders.models import Order

from .models import ProviderProfile, User


class ListingInline(admin.TabularInline):
    model = Listing
    extra = 0
    fields = ["title", "service", "base_price", "price_unit", "estimated_duration_minutes", "is_active"]
    readonly_fields = ["created_at"]
    show_change_link = True

    class Meta:
        verbose_name = "Servicio ofrecido"
        verbose_name_plural = "Servicios ofrecidos"


class OrderInline(admin.TabularInline):
    model = Order
    fk_name = "job_request"
    extra = 0
    fields = ["id", "status", "amount", "created_at"]
    readonly_fields = ["id", "status", "amount", "created_at"]
    show_change_link = True
    max_num = 0
    can_delete = False

    verbose_name = "Orden"
    verbose_name_plural = "Ordenes"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("match__provider")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "get_full_name_display", "phone", "is_provider", "is_active", "date_joined"]
    list_filter = ["is_provider", "is_active", "is_staff"]
    search_fields = ["email", "first_name", "last_name", "phone"]
    ordering = ["-date_joined"]

    def get_full_name_display(self, obj):
        name = obj.get_full_name()
        return name if name.strip() else obj.username
    get_full_name_display.short_description = "Nombre"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            # Staff no-superuser solo ve proveedores
            qs = qs.filter(is_provider=True)
        return qs


@admin.register(ProviderProfile)
class ProviderProfileAdmin(GISModelAdmin):
    list_display = [
        "get_nombre",
        "get_telefono",
        "get_categorias",
        "price_band",
        "is_active",
        "is_verified",
        "average_rating",
        "total_reviews",
        "total_completed_orders",
        "created_at",
    ]
    list_filter = [
        "is_active",
        "is_verified",
        "price_band",
        "categories",
    ]
    search_fields = [
        "user__email",
        "user__first_name",
        "user__last_name",
        "user__phone",
        "bio",
    ]
    list_editable = ["is_active", "is_verified", "price_band"]
    list_per_page = 25
    filter_horizontal = ["categories"]
    raw_id_fields = ["user"]
    readonly_fields = [
        "average_rating",
        "total_reviews",
        "total_completed_orders",
        "average_response_time_minutes",
        "created_at",
        "updated_at",
    ]
    inlines = [ListingInline]

    fieldsets = (
        (
            "Proveedor",
            {"fields": ("user", "bio", "is_active", "is_verified")},
        ),
        (
            "Ubicacion y Cobertura",
            {"fields": ("location", "radius_km")},
        ),
        (
            "Servicios y Precios",
            {"fields": ("categories", "price_band")},
        ),
        (
            "Estadisticas",
            {
                "fields": (
                    "average_rating",
                    "total_reviews",
                    "total_completed_orders",
                    "average_response_time_minutes",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Disponibilidad (JSON)",
            {"fields": ("availability",), "classes": ("collapse",)},
        ),
        (
            "Fechas",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_nombre(self, obj):
        name = obj.user.get_full_name()
        if not name.strip():
            name = obj.user.username
        return format_html("<strong>{}</strong><br><small>{}</small>", name, obj.user.email)
    get_nombre.short_description = "Proveedor"
    get_nombre.admin_order_field = "user__first_name"

    def get_telefono(self, obj):
        return obj.user.phone or "-"
    get_telefono.short_description = "Telefono"
    get_telefono.admin_order_field = "user__phone"

    def get_categorias(self, obj):
        cats = obj.categories.all()
        return ", ".join(c.name for c in cats) if cats else "-"
    get_categorias.short_description = "Categorias"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("user")
            .prefetch_related("categories")
        )

    actions = ["activar_proveedores", "desactivar_proveedores", "verificar_proveedores"]

    @admin.action(description="Activar proveedores seleccionados")
    def activar_proveedores(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} proveedor(es) activado(s).")

    @admin.action(description="Desactivar proveedores seleccionados")
    def desactivar_proveedores(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} proveedor(es) desactivado(s).")

    @admin.action(description="Marcar como verificados")
    def verificar_proveedores(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"{updated} proveedor(es) verificado(s).")
