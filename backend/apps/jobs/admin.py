from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import JobRequest, Match


@admin.register(JobRequest)
class JobRequestAdmin(GISModelAdmin):
    list_display = ["id", "user", "service", "status", "budget_estimate", "created_at"]
    list_filter = ["status", "service__category"]
    search_fields = ["user__email", "details"]
    raw_id_fields = ["user", "service"]


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ["id", "job_request", "provider", "status", "score", "price_quote", "created_at"]
    list_filter = ["status"]
    search_fields = ["job_request__id", "provider__user__email"]
    raw_id_fields = ["job_request", "provider"]
