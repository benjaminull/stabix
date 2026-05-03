from django.contrib import admin

from .models import Service, ServiceCategory


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 1
    fields = ["name", "slug", "is_active", "order"]
    prepopulated_fields = {"slug": ("name",)}
    show_change_link = True


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "get_servicios_count", "is_active", "order"]
    list_filter = ["is_active"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ["is_active", "order"]
    inlines = [ServiceInline]

    def get_servicios_count(self, obj):
        return obj.services.count()
    get_servicios_count.short_description = "Servicios"

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("services")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "is_active", "order"]
    list_filter = ["is_active", "category"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ["is_active", "order"]
