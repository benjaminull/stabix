from django.contrib import admin

from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "job_request",
        "match",
        "status",
        "amount",
        "scheduled_at",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["id", "job_request__id", "payment_ref"]
    raw_id_fields = ["job_request", "match"]
    readonly_fields = ["created_at", "updated_at"]
