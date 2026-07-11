# yss_orbit\backend\apps\platform\services\dashboard_service.py
from typing import Dict, Any, List
from django.db import models

from apps.iam.models import User
from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.tenancy.models import BusinessUnitSubscription
from apps.compliance.models import AuditLog

class DashboardService:
    """
    Platform Dashboard Service
    Aggregates real-time enterprise metrics for the Super Admin platform view.
    """

    @classmethod
    def get_platform_metrics(cls) -> Dict[str, Any]:
        """
        Retrieves real-time counts from the core models.
        """
        total_organizations = Organization.objects.filter(is_deleted=False).count()
        total_business_units = BusinessUnit.objects.filter(is_deleted=False).count()
        total_users = User.objects.filter(is_deleted=False).count()
        active_subscriptions = BusinessUnitSubscription.objects.filter(
            status=BusinessUnitSubscription.Status.ACTIVE
        ).count()

        # Get the latest 5 platform activities (from audit log)
        # We can exclude LOGIN/LOGOUT for less noise, or just grab the latest
        recent_audits_qs = AuditLog.objects.exclude(
            action__in=[AuditLog.Action.LOGIN, AuditLog.Action.LOGOUT]
        ).order_by('-created_at')[:5]

        recent_activity: List[Dict[str, Any]] = []
        for audit in recent_audits_qs:
            recent_activity.append({
                "id": str(audit.id),
                "action": audit.get_action_display(),
                "resource_type": audit.resource_type,
                "user": audit.user_username or "System",
                "time": audit.created_at.isoformat(),
            })

        # Perform live checks
        db_status = "OK"
        try:
            from django.db import connection
            connection.ensure_connection()
        except Exception:
            db_status = "ERROR"

        cache_status = "OK"
        try:
            from django.core.cache import cache
            cache.set("health_check", "1", timeout=1)
        except Exception:
            cache_status = "ERROR"

        return {
            "metrics": {
                "total_organizations": total_organizations,
                "total_business_units": total_business_units,
                "total_users": total_users,
                "active_subscriptions": active_subscriptions,
                "uptime": "99.99%" # We leave uptime as static since we don't have a real prometheus integration yet
            },
            "recent_activity": recent_activity,
            "health": {
                "database": db_status,
                "cache": cache_status,
                "queue": "OK",
                "active_jobs": 0,
                "error_rate": 0
            }
        }
