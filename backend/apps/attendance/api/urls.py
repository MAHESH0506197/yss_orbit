# yss_orbit\backend\apps\attendance\api\urls.py
from django.urls import path

from apps.attendance.api.views import (
    CheckInView, CheckOutView,
    AttendanceListView, AttendanceDetailView,
    RegularizeAttendanceView, AttendanceSummaryView,
    AttendanceLogView,
    ShiftListView, ShiftDetailView,
)

app_name = "attendance"

urlpatterns = [
    # ── Check-in / Check-out
    path("check-in/", CheckInView.as_view(), name="check-in"),
    path("check-out/", CheckOutView.as_view(), name="check-out"),

    # ── Attendance Records
    path("records/", AttendanceListView.as_view(), name="record-list"),
    path("records/<uuid:pk>/", AttendanceDetailView.as_view(), name="record-detail"),
    path("records/<uuid:pk>/regularize/", RegularizeAttendanceView.as_view(), name="record-regularize"),
    
    # ── Summary & Logs
    path("summary/", AttendanceSummaryView.as_view(), name="summary"),
    path("logs/", AttendanceLogView.as_view(), name="logs"),

    # ── Shifts
    path("shifts/", ShiftListView.as_view(), name="shift-list"),
    path("shifts/<uuid:pk>/", ShiftDetailView.as_view(), name="shift-detail"),
]
