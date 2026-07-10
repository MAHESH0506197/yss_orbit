# yss_orbit\backend\apps\leave\api\urls.py
from django.urls import path
from apps.leave.api.views import (
    LeaveTypeListView, LeaveTypeDetailView,
    LeaveBalanceView,
    LeaveRequestListView, LeaveRequestDetailView,
    LeaveApproveView, LeaveRejectView, LeaveCancelView,
)

app_name = "leave"

urlpatterns = [
    # ── Leave Types ───────────────────────────────────────────────────────────
    path("types/", LeaveTypeListView.as_view(), name="leave-type-list"),
    path("types/<uuid:pk>/", LeaveTypeDetailView.as_view(), name="leave-type-detail"),

    # ── Leave Balances ────────────────────────────────────────────────────────
    path("balances/", LeaveBalanceView.as_view(), name="leave-balance"),

    # ── Leave Requests ────────────────────────────────────────────────────────
    path("requests/", LeaveRequestListView.as_view(), name="leave-request-list"),
    path("requests/<uuid:pk>/", LeaveRequestDetailView.as_view(), name="leave-request-detail"),
    path("requests/<uuid:pk>/approve/", LeaveApproveView.as_view(), name="leave-approve"),
    path("requests/<uuid:pk>/reject/", LeaveRejectView.as_view(), name="leave-reject"),
    path("requests/<uuid:pk>/cancel/", LeaveCancelView.as_view(), name="leave-cancel"),
]
