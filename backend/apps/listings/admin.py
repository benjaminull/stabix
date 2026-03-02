from django.contrib import admin

from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ["title", "provider", "service", "base_price", "is_active", "created_at"]
    list_filter = ["is_active", "service__category"]
    search_fields = ["title", "description", "provider__user__email"]
    raw_id_fields = ["provider", "service"]
