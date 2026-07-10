# yss_orbit\backend\apps\pqm\api\urls.py
"""
PQM API URL Configuration
All routes are prefixed with /api/v1/pqm/ in config/urls.py
"""
from django.urls import path

from apps.pqm.api.views.nc_views import (
    NCListView, NCDetailView, NCSubmitView, NCReviewDecisionView,
    NCAssignView, NCStartWorkView, NCRequestClosureView,
    NCVerificationDecisionView, NCReopenView, NCReassignView,
    NCMergeView, NCDuplicateCheckView,
)
from apps.pqm.api.views.attachment_views import NCAttachmentListView, NCAttachmentDetailView
from apps.pqm.api.views.comment_views import NCCommentListView
from apps.pqm.api.views.extension_views import NCExtensionRequestView, NCExtensionDecisionView
from apps.pqm.api.views.history_views import NCHistoryView
from apps.pqm.api.views.dashboard_views import DashboardSummaryView, TrendAnalyticsView
from apps.pqm.api.views.config_views import (
    ContractorListView, ContractorDetailView,
    EscalationConfigView,
)
from apps.pqm.api.views.settings_views import DropdownOptionListView, DropdownOptionDetailView
from apps.pqm.api.views.project_views import PQMProjectListView, PQMProjectDetailView, PQMProjectRestoreView
from apps.pqm.api.views.project_access_views import ProjectAccessRequestView, ProjectAccessApprovalView, ProjectMembersView
from apps.pqm.api.views.site_views import PQMSiteListView, PQMSiteDetailView
from apps.pqm.api.views.import_views import LegacyImportView
from apps.pqm.api.views.report_views import NCExportView
from apps.pqm.api.views.bulk_views import NCBulkActionView

app_name = "pqm"

urlpatterns = [
    # ── Dashboard ─────────────────────────────────────────────────────────
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard"),
    path("dashboard/trends/", TrendAnalyticsView.as_view(), name="dashboard-trends"),

    # ── Non-Conformance CRUD ──────────────────────────────────────────────
    path("nc/", NCListView.as_view(), name="nc-list"),
    path("nc/bulk-action/", NCBulkActionView.as_view(), name="nc-bulk-action"),
    path("nc/export/", NCExportView.as_view(), name="nc-export"),
    path("nc/<uuid:pk>/", NCDetailView.as_view(), name="nc-detail"),

    # ── NC Lifecycle Actions ──────────────────────────────────────────────
    path("nc/<uuid:pk>/submit/", NCSubmitView.as_view(), name="nc-submit"),
    path("nc/<uuid:pk>/review-decision/", NCReviewDecisionView.as_view(), name="nc-review-decision"),
    path("nc/<uuid:pk>/assign/", NCAssignView.as_view(), name="nc-assign"),
    path("nc/<uuid:pk>/start-work/", NCStartWorkView.as_view(), name="nc-start-work"),
    path("nc/<uuid:pk>/request-closure/", NCRequestClosureView.as_view(), name="nc-request-closure"),
    path("nc/<uuid:pk>/verification-decision/", NCVerificationDecisionView.as_view(), name="nc-verification-decision"),
    path("nc/<uuid:pk>/reopen/", NCReopenView.as_view(), name="nc-reopen"),
    path("nc/<uuid:pk>/reassign/", NCReassignView.as_view(), name="nc-reassign"),
    path("nc/<uuid:pk>/merge/", NCMergeView.as_view(), name="nc-merge"),
    path("nc/<uuid:pk>/duplicate-check/", NCDuplicateCheckView.as_view(), name="nc-duplicate-check"),

    # ── NC Child Resources ────────────────────────────────────────────────
    path("nc/<uuid:pk>/attachments/", NCAttachmentListView.as_view(), name="nc-attachments"),
    path("nc/<uuid:pk>/attachments/<uuid:apk>/", NCAttachmentDetailView.as_view(), name="nc-attachment-detail"),
    path("nc/<uuid:pk>/comments/", NCCommentListView.as_view(), name="nc-comments"),
    path("nc/<uuid:pk>/extension-request/", NCExtensionRequestView.as_view(), name="nc-extension-request"),
    path("nc/<uuid:pk>/extension-decision/", NCExtensionDecisionView.as_view(), name="nc-extension-decision"),
    path("nc/<uuid:pk>/history/", NCHistoryView.as_view(), name="nc-history"),

    # ── Projects & Sites ──────────────────────────────────────────────────
    path("projects/request-access/", ProjectAccessRequestView.as_view(), name="project-request-access"),
    path("projects/access-approvals/", ProjectAccessApprovalView.as_view(), name="project-access-approvals"),
    path("projects/<uuid:pk>/members/", ProjectMembersView.as_view(), name="project-members"),
    path("projects/", PQMProjectListView.as_view(), name="project-list"),
    path("projects/<uuid:pk>/", PQMProjectDetailView.as_view(), name="project-detail"),
    path("projects/<uuid:pk>/restore/", PQMProjectRestoreView.as_view(), name="project-restore"),
    path("sites/", PQMSiteListView.as_view(), name="site-list"),
    path("sites/<uuid:pk>/", PQMSiteDetailView.as_view(), name="site-detail"),

    # ⚙️ Configuration ⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️⚙️
    path("config/contractors/", ContractorListView.as_view(), name="contractor-list"),
    path("config/contractors/<uuid:pk>/", ContractorDetailView.as_view(), name="contractor-detail"),
    path("config/escalation/", EscalationConfigView.as_view(), name="escalation-config"),
    path("settings/dropdowns/", DropdownOptionListView.as_view(), name="dropdown-list"),
    path("settings/dropdowns/<uuid:pk>/", DropdownOptionDetailView.as_view(), name="dropdown-detail"),

    # ── Import ─────────────────────────────────────────────────────────────
    path("import/legacy/", LegacyImportView.as_view(), name="legacy-import"),
]
