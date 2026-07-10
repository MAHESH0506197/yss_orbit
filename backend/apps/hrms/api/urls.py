# yss_orbit\backend\apps\hrms\api\urls.py
"""
YSS Orbit — HRMS URL Configuration
Registers all HRMS endpoints under /api/v1/hrms/.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.hrms.api.views import (
    DepartmentDetailView,
    DepartmentListView,
    DesignationDetailView,
    DesignationListView,
    EmployeeDetailView,
    EmployeeDocumentView,
    EmployeeListView,
    EmployeePhotoUploadView,
    # Onboarding
    OnboardingInitView, OnboardingProgressView, OnboardingTaskCompleteView,
    # Transfer
    TransferListCreateView, TransferApproveView,
    # Promotion
    PromotionListCreateView, PromotionApproveView,
    # Exit
    ExitSubmitView, ExitApproveView, ExitCompleteView, ExitWithdrawView,
    # Asset
    EmployeeAssetListView, AssetAssignView, AssetReturnView,
    # Training
    TrainingEnrollView, TrainingCompleteView, EmployeeTrainingHistoryView, TrainingGapReportView,
    # Employee 360
    Employee360TimelineView,
)
from apps.hrms.api.views.employee_import_view import (
    EmployeeImportTemplateView,
    EmployeeImportUploadView,
    EmployeeImportValidateView,
    EmployeeImportExecuteView,
    EmployeeImportErrorView,
    EmployeeImportHistoryView,
)
from apps.hrms.api.views.attendance_view import AttendanceViewSet
from apps.hrms.api.views.attendance_correction_view import AttendanceCorrectionRequestViewSet
from apps.hrms.api.views.leave_view import (
    LeaveBalanceListView,
    LeaveRequestListView,
    LeaveRequestApproveView,
    LeaveRequestHRApproveView,
    LeaveRequestCancelView,
    LeaveRequestRejectView,
)
from apps.hrms.api.views.setup_views import (
    LeaveTypeViewSet,
    LeavePolicyViewSet,
    LeaveRestrictionWindowViewSet,
    LeaveAllocationView,
    HolidayCalendarViewSet,
    HolidayViewSet,
)
from apps.hrms.api.views.analytics_view import (
    AnalyticsSnapshotView,
    AnalyticsSnapshotComputeView,
    AnalyticsDashboardView,
)

app_name = "hrms"

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'attendance-correction', AttendanceCorrectionRequestViewSet, basename='attendance-correction')

# ── Setup ViewSets ───────────────────────────────────────────────────────────
router.register(r'leave/policies', LeavePolicyViewSet, basename='leave-policies')
router.register(r'leave/types', LeaveTypeViewSet, basename='leave-types')
router.register(r'leave/restriction-windows', LeaveRestrictionWindowViewSet, basename='leave-restriction-windows')
router.register(r'holidays/calendars', HolidayCalendarViewSet, basename='holiday-calendars')

urlpatterns = [
    path('', include(router.urls)),
    
    # Nested Holiday Routes
    path("holidays/calendars/<uuid:calendar_id>/holidays/", HolidayViewSet.as_view({'get': 'list', 'post': 'create'}), name="holiday-list"),
    path("holidays/calendars/<uuid:calendar_id>/holidays/<uuid:pk>/", HolidayViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name="holiday-detail"),

    # ── Employees ────────────────────────────────────────────────────────────
    path("employees/", EmployeeListView.as_view(), name="employee-list"),
    path("employees/<uuid:pk>/", EmployeeDetailView.as_view(), name="employee-detail"),
    path("employees/<uuid:emp_pk>/documents/", EmployeeDocumentView.as_view(), name="employee-documents"),
    path("employees/<uuid:pk>/photo/", EmployeePhotoUploadView.as_view(), name="employee-photo"),

    # ── Employee 360 — Timeline ───────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/timeline/", Employee360TimelineView.as_view(), name="employee-timeline"),

    # ── Onboarding ───────────────────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/onboarding/init/", OnboardingInitView.as_view(), name="onboarding-init"),
    path("employees/<uuid:emp_pk>/onboarding/progress/", OnboardingProgressView.as_view(), name="onboarding-progress"),
    path("onboarding/<uuid:onboarding_id>/tasks/<uuid:task_id>/complete/", OnboardingTaskCompleteView.as_view(), name="onboarding-task-complete"),

    # ── Transfer ─────────────────────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/transfers/", TransferListCreateView.as_view(), name="employee-transfers"),
    path("transfers/<uuid:transfer_id>/approve/", TransferApproveView.as_view(), name="transfer-approve"),

    # ── Promotion ────────────────────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/promotions/", PromotionListCreateView.as_view(), name="employee-promotions"),
    path("promotions/<uuid:promotion_id>/approve/", PromotionApproveView.as_view(), name="promotion-approve"),

    # ── Exit Workflow ─────────────────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/exit/submit/", ExitSubmitView.as_view(), name="exit-submit"),
    path("exit/<uuid:exit_request_id>/approve/", ExitApproveView.as_view(), name="exit-approve"),
    path("exit/<uuid:exit_request_id>/complete/", ExitCompleteView.as_view(), name="exit-complete"),
    path("exit/<uuid:exit_request_id>/withdraw/", ExitWithdrawView.as_view(), name="exit-withdraw"),

    # ── Asset ─────────────────────────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/assets/", EmployeeAssetListView.as_view(), name="employee-assets"),
    path("assets/<uuid:asset_id>/assign/", AssetAssignView.as_view(), name="asset-assign"),
    path("asset-assignments/<uuid:assignment_id>/return/", AssetReturnView.as_view(), name="asset-return"),

    # ── Training ──────────────────────────────────────────────────────────────
    path("employees/<uuid:emp_pk>/training/", EmployeeTrainingHistoryView.as_view(), name="employee-training"),
    path("training/courses/<uuid:course_id>/enroll/", TrainingEnrollView.as_view(), name="training-enroll"),
    path("training/enrollments/<uuid:enrollment_id>/complete/", TrainingCompleteView.as_view(), name="training-complete"),
    path("training/gaps/", TrainingGapReportView.as_view(), name="training-gaps"),

    # ── Leave Management ─────────────────────────────────────────────────────
    path("leave/allocations/", LeaveAllocationView.as_view(), name="leave-allocations"),
    path("leave/balances/", LeaveBalanceListView.as_view(), name="leave-balances"),
    path("leave/requests/", LeaveRequestListView.as_view(), name="leave-requests"),
    path("leave/requests/<uuid:pk>/approve/", LeaveRequestApproveView.as_view(), name="leave-requests-approve"),
    path("leave/requests/<uuid:pk>/hr-approve/", LeaveRequestHRApproveView.as_view(), name="leave-requests-hr-approve"),
    path("leave/requests/<uuid:pk>/cancel/", LeaveRequestCancelView.as_view(), name="leave-requests-cancel"),
    path("leave/requests/<uuid:pk>/reject/", LeaveRequestRejectView.as_view(), name="leave-requests-reject"),

    # ── Analytics ─────────────────────────────────────────────────────────────
    path("analytics/snapshot/", AnalyticsSnapshotView.as_view(), name="analytics-snapshot"),
    path("analytics/snapshot/compute/", AnalyticsSnapshotComputeView.as_view(), name="analytics-snapshot-compute"),
    path("analytics/dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),

    # ── Employee Import ──────────────────────────────────────────────────────
    path("employees/import/template/", EmployeeImportTemplateView.as_view(), name="employee-import-template"),
    path("employees/import/upload/", EmployeeImportUploadView.as_view(), name="employee-import-upload"),
    path("employees/import/validate/<uuid:session_id>/", EmployeeImportValidateView.as_view(), name="employee-import-validate"),
    path("employees/import/execute/<uuid:session_id>/", EmployeeImportExecuteView.as_view(), name="employee-import-execute"),
    path("employees/import/errors/<uuid:session_id>/", EmployeeImportErrorView.as_view(), name="employee-import-errors"),
    path("employees/import/history/", EmployeeImportHistoryView.as_view(), name="employee-import-history"),

    # ── Departments ──────────────────────────────────────────────────────────
    path("departments/", DepartmentListView.as_view(), name="department-list"),
    path("departments/<uuid:pk>/", DepartmentDetailView.as_view(), name="department-detail"),

    # ── Designations ─────────────────────────────────────────────────────────
    path(
        "designations/",
        DesignationListView.as_view(),
        name="designation-list",
    ),
    path(
        "designations/<uuid:pk>/",
        DesignationDetailView.as_view(),
        name="designation-detail",
    ),
]
