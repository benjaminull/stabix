from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.gis.admin import GISModelAdmin

from .models import ProviderProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "username", "is_provider", "phone_verified", "is_active"]
    list_filter = ["is_provider", "phone_verified", "is_active", "is_staff"]
    search_fields = ["email", "username", "phone"]
    ordering = ["-date_joined"]


@admin.register(ProviderProfile)
class ProviderProfileAdmin(GISModelAdmin):
    list_display = [
        "user",
        "price_band",
        "radius_km",
        "is_active",
        "is_verified",
        "average_rating",
        "total_reviews",
    ]
    list_filter = ["is_active", "is_verified", "price_band"]
    search_fields = ["user__email", "user__username"]
    raw_id_fields = ["user"]
