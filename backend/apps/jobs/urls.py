"""
Job URLs
"""

from django.urls import path

from .views import (
    JobMatchListView,
    JobRequestDetailView,
    JobRequestListCreateView,
    accept_match,
    run_job_matching,
)

urlpatterns = [
    path("job-requests/", JobRequestListCreateView.as_view(), name="job_request_list_create"),
    path("job-requests/<int:pk>/", JobRequestDetailView.as_view(), name="job_request_detail"),
    path("job-requests/<int:pk>/match/", run_job_matching, name="job_request_match"),
    path(
        "job-requests/<int:job_request_id>/matches/",
        JobMatchListView.as_view(),
        name="job_match_list",
    ),
    path("matches/<int:pk>/accept/", accept_match, name="match_accept"),
]
