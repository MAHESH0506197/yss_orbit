# yss_orbit\backend\core\permissions\tenant_permission.py
"""
YSS Orbit - Business Unit Permission
Ensures multi-tenant isolation by verifying BU membership.

3.1 fix: B02 §5.1 — The canonical isolation header is X-Business-Unit-Id (NOT X-Tenant-ID).
         B03 §5.3 — Multi-tenancy discriminator is business_unit_id (NOT tenant_id).
         The field tenant_id does NOT exist on any domain model.
"""
from __future__ import annotations

from rest_framework.request import Request
from django.views import View
from .base_permissions import YSSBasePermission


class IsTenantMember(YSSBasePermission):
    """
    Checks if the user belongs to the Business Unit they are trying to access.

    3.1 fix: B02 §5.1 — Uses X-Business-Unit-Id header (renamed from X-Tenant-ID).
    3.1 fix: B03 §5.3 — Membership is stored in UserBusinessUnitModel, not user.tenants.
    """

    message = "You do not have access to this business unit."

    def has_permission(self, request: Request, view: View) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(request.user, "is_super_admin", False):
            return True

        # 3.1 fix: Canonical header is X-Business-Unit-Id (B02 §5.1), NOT X-Tenant-ID
        requested_bu_id = (
            view.kwargs.get("business_unit_id")
            or request.headers.get("X-Business-Unit-Id")
        )

        if not requested_bu_id:
            self.log_denial(request, view, "No business unit context provided")
            return False

        # 3.1 fix: Canonical membership table is UserBusinessUnitModel (B03 §5.3)
        # 3.1 fix-2: UserBusinessUnitModel uses is_active_membership (not is_active)
        from apps.organization.models import UserBusinessUnitModel
        is_member = UserBusinessUnitModel.objects.filter(
            user=request.user,
            business_unit_id=requested_bu_id,
            is_active_membership=True,  # 3.1 fix-2: correct field name
            is_deleted=False,
        ).exists()

        if not is_member:
            self.log_denial(
                request, view, f"User is not a member of BU {requested_bu_id}"
            )
            return False

        return True

    def has_object_permission(self, request: Request, view: View, obj: object) -> bool:
        if getattr(request.user, "is_super_admin", False):
            return True

        # 3.1 fix: Field is business_unit_id (B03 §5.3), NOT tenant_id
        obj_bu_id = str(getattr(obj, "business_unit_id", "") or "")
        if not obj_bu_id:
            # Object has no BU scope — allow (platform-level entity)
            return True

        requested_bu_id = request.headers.get("X-Business-Unit-Id", "")

        if obj_bu_id != str(requested_bu_id):
            self.log_denial(
                request, view, "Object belongs to a different business unit"
            )
            return False

        return True
