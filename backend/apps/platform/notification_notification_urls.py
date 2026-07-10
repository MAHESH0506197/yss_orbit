# yss_orbit\backend\apps\notification\notification_urls.py
"""
YSS Orbit — Notification URL Configuration

All routes are namespaced under /api/v1/notifications/ and included
from the root api/v1/urls.py.
"""
from __future__ import annotations

from django.urls import path

from apps.platform.notification_views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
)

app_name = "notifications"

urlpatterns = [
    # GET /api/v1/notifications/
    path(
        "",
        NotificationListView.as_view(),
        name="notification-list",
    ),
    # GET /api/v1/notifications/unread-count/
    # Must be declared BEFORE the <str:notification_id> pattern to avoid
    # "unread-count" being captured as a notification_id slug.
    path(
        "unread-count/",
        NotificationUnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    # POST /api/v1/notifications/read-all/
    path(
        "read-all/",
        NotificationMarkAllReadView.as_view(),
        name="notification-read-all",
    ),
    # POST /api/v1/notifications/{notification_id}/read/
    path(
        "<str:notification_id>/read/",
        NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
]
