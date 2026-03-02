from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "sender", "sender_type", "is_read", "created_at"]
    list_filter = ["sender_type", "is_read", "created_at"]
    search_fields = ["order__id", "sender__email", "text"]
    raw_id_fields = ["order", "sender"]
