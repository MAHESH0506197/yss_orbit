# yss_orbit\backend\config\urls.py
"""
YSS Orbit — Master URL Configuration
All API routes are versioned under /api/v1/.
Public endpoints (CSRF init, health, schema) have no auth requirement.
"""
from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

# ---------------------------------------------------------------------------
# API v1 Routes
# ---------------------------------------------------------------------------
api_v1_patterns = [
    # Auth & Users
    path("auth/", include("apps.iam.api.urls.auth_urls")),
    path("users/", include("apps.iam.api.urls.user_urls")),
    path("profile/", include("apps.iam.api.urls.profile_urls")),
    path("branding/", include("apps.platform.api.urls.branding_urls")),
    path("organizations/", include("apps.organization.api.urls.organization_urls")),
    path("business-domains/", include("apps.organization.api.urls.business_domain_urls")),
    path("business-units/", include("apps.organization.api.urls.business_unit_urls")),

    # Core HR Modules
    path("hrms/", include("apps.hrms.api.urls")),
    path("attendance/", include("apps.attendance.api.urls")),
    path("leave/", include("apps.leave.api.urls")),
    path("payroll/", include("apps.payroll.api.urls")),

    # FIX-BUG20 (CRITICAL): apps.iam.api.urls registers its OWN 'roles' and
    # 'permissions' prefixes via DefaultRouter:
    #     router.register(r'roles', RoleViewSet, basename='roles')
    #     router.register(r'permissions', PermissionViewSet, basename='permissions')
    # Previously mounted under an ADDITIONAL "roles/" prefix here, producing:
    #     /api/v1/roles/roles/        → RoleViewSet       (should be /api/v1/roles/)
    #     /api/v1/roles/permissions/  → PermissionViewSet  (should be /api/v1/permissions/)
    # Every frontend call to GET /api/v1/permissions/ and /api/v1/roles/ 404'd
    # for everyone, including super-admins. Mount at "" so apps.iam.api.urls'
    # own router prefixes resolve correctly.
    path("", include("apps.iam.api.urls.rbac_urls")),

    path("user-bu-mapping/", include("apps.organization.api.urls.user_business_unit_urls")),
    path("domains/", include("apps.tenancy.api.urls")),

    # Settings & Developer Tools
    path("audit/", include("apps.compliance.api.urls")),
    path("errors/", include("apps.compliance.api.urls")),
    path("api-keys/", include("apps.platform.api.urls.api_consumer_key_urls")),
    path("webhooks/", include("apps.platform.api.urls.webhook_urls")),
    path("integrations/", include("apps.platform.api.urls.integration_urls")),
    path("feature-flags/", include("apps.platform.api.urls.feature_flag_urls")),
    path("jobs/", include("apps.platform.api.urls.job_urls")),
    path("platform/", include("apps.platform.api.urls.dashboard_urls")),
    path("file-storage/", include("apps.platform.api.urls.file_storage_urls")),

    # Platform Governance
    path("subscription/", include("apps.tenancy.api.urls")),
    path("tenant-settings/", include("apps.tenancy.api.urls")),
    path("tenant-module/", include("apps.tenancy.api.urls")),
    path("modules/", include("apps.platform.api.urls.module_registry_urls")),
    path("platform-admin/", include("apps.platform.api.urls.platform_admin_urls")),


    # Project Quality Management
    path("pqm/", include("apps.pqm.api.urls", namespace="pqm")),

    # Notifications unread count — stub until notification module is fully implemented.
    # M-2 fix: Lambda bypassed DRF auth entirely. Now a proper @api_view with IsAuthenticated.
    # TODO(PROJ-001): Replace stub with real Notification model query when module is built.
    path("notifications/unread-count/", include("apps.iam.api.urls.notification_stub_urls")),
]

# ---------------------------------------------------------------------------
# Public Routes (no authentication required)
# ---------------------------------------------------------------------------
from apps.iam.api.views.auth_views import csrf_init
public_patterns = [
    path("api/init/", csrf_init, name="csrf-init"),
    path("api/tenant-config/", include("apps.platform.branding_public_urls")),
]

# ---------------------------------------------------------------------------
# OpenAPI Schema (authenticated in production)
# ---------------------------------------------------------------------------
try:
    from drf_spectacular.views import (
        SpectacularAPIView,
        SpectacularRedocView,
        SpectacularSwaggerView,
    )
    schema_patterns = [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
        path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    ]
except ImportError:
    schema_patterns = []

# ---------------------------------------------------------------------------
# Master URL Configuration
# ---------------------------------------------------------------------------
urlpatterns = [
    # Django admin
    path("django-admin/", admin.site.urls),

    # API v1
    path("api/v1/", include((api_v1_patterns, "api_v1"), namespace="api_v1")),

    # Public routes
    *public_patterns,

    # Schema / docs
    *schema_patterns,
]

# ---------------------------------------------------------------------------
# Development Additions
# ---------------------------------------------------------------------------
if settings.DEBUG:
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns += [
            path("__debug__/", include(debug_toolbar.urls)),
        ]
    if "silk" in settings.INSTALLED_APPS:
        urlpatterns += [
            path("silk/", include("silk.urls", namespace="silk")),
        ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
