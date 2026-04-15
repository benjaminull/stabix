"""
Common URL patterns: notifications
"""

from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    mark_all_read,
    mark_notification_read,
    unread_count,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/<int:pk>/read/", mark_notification_read, name="notification-read"),
    path("notifications/mark-all-read/", mark_all_read, name="notifications-mark-all-read"),
    path("notifications/unread-count/", unread_count, name="notifications-unread-count"),
]
