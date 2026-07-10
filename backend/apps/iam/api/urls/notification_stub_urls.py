# yss_orbit\backend\apps\users\api\urls\notification_stub_urls.py
"""
YSS Orbit — Notification Stub URLs
M-2 fix: Replaces the anonymous lambda endpoint that bypassed DRF auth.
TODO(PROJ-001): Remove stub and wire to the real notification module.
"""
from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.platform.core_response import success_response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notification_unread_count(request):
    """
    GET /api/v1/notifications/unread-count/
    Returns unread notification count for the current user.
    Stub implementation — returns 0 until the Notification module is built.
    B07 §5.3: IsAuthenticated enforced (previous lambda had no auth at all).
    B12: Returns proper DRF response envelope via success_response.
    TODO(PROJ-001): Replace with real Notification.objects.filter(user=request.user, is_read=False).count()
    """
    return success_response(
        data={"count": 0},
        request=request,
    )


urlpatterns = [
    path("", notification_unread_count, name="notification-unread-count"),
]
