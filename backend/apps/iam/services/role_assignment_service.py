# yss_orbit\backend\apps\rbac\services\role_assignment_service.py
"""
YSS Orbit — Role Assignment Service

FIX-BUG36/37: process() was a generic no-op stub ("Simulate business logic"
+ AuditService.record + return True). This is the CORE FIX for BUG-36:
UserBusinessUnitModel.role (a plain FK, set by UserBusinessUnitViewSet) and
UserRole (rbac_user_roles — the table RBACService.get_user_permissions_as_
frozenset() actually reads via UserRoleRepository.get_active_for_user_in_bu)
were never synced. A role assigned via the User-BU mapping API had ZERO
effect on the user's actual permissions.

sync_user_role() is now the SINGLE function both call sites use:
  - apps.organization.services.user_business_unit_service
    .UserBusinessUnitService (5 touch points: create/update/deactivate/
    activate/delete_membership — IMPLEMENTATION_PLAN.md item 1)
  - apps.iam.api.views.user_role_view.UserRoleViewSet (direct
    "user-RBAC mapping" CRUD — IMPLEMENTATION_PLAN.md item 2)

UserRole has a partial UniqueConstraint: at most ONE is_active=True row per
(user_id, business_unit_id) — but unlimited revoked (is_active=False,
historical) rows. sync_user_role() handles all 3 outcomes:
  - new_role_id is None            → revoke the current active row (if any)
  - new_role_id == current active  → no-op (idempotent)
  - new_role_id differs            → revoke current active row, then either
                                      re-activate a matching revoked row for
                                      this exact role (preserves
                                      assigned_at/assigned_by history) or
                                      create a new UserRole row

Cache invalidation: apps/rbac/signals.py already connects UserRole's
post_save/post_delete to RBACService.invalidate_user_permissions() — so
callers of sync_user_role() get cache invalidation "for free" via Django
signals, no explicit call needed here.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional

from django.db import transaction
from django.utils import timezone

from core.audit.audit_service import AuditService
from apps.iam.models.rbac_models import UserRole

logger = logging.getLogger(__name__)


class RoleAssignmentService:
    """
    Enterprise-grade Service for RoleAssignment.
    Includes detailed audit tracking on identity modification.
    """

    @classmethod
    @transaction.atomic
    def sync_user_role(
        cls,
        user_id: uuid.UUID | str,
        business_unit_id: uuid.UUID | str,
        new_role_id: Optional[uuid.UUID | str],
        actor_user_id: Optional[uuid.UUID | str] = None,
    ) -> Optional[UserRole]:
        """
        Ensure exactly one active UserRole exists for (user_id,
        business_unit_id) with role_id == new_role_id (or none, if
        new_role_id is None).

        Returns the resulting active UserRole, or None if new_role_id was
        None (role unassigned).

        This method is idempotent and safe to call even when nothing
        actually changes (e.g. update_membership called with the same
        role_id) — it's a no-op in that case, and does NOT write to
        AuditService or touch assigned_at/assigned_by for the unchanged row.
        """
        current_active = (
            UserRole.objects
            .filter(user_id=user_id, business_unit_id=business_unit_id, is_active=True)
            .select_for_update()
            .first()
        )

        # Case 1: no-op — already correct.
        if current_active and str(current_active.role_id) == str(new_role_id):
            return current_active
        if current_active is None and new_role_id is None:
            return None

        now = timezone.now()

        # Case 2: revoke the current active row (covers both "unassign" and
        # "reassign to a different role" — reassign continues below).
        if current_active is not None:
            current_active.is_active = False
            current_active.revoked_at = now
            current_active.save(update_fields=["is_active", "revoked_at"])

            AuditService.record(
                action="REVOKE",
                resource="rbac.UserRole",
                resource_id=str(current_active.id),
                changes={
                    "user_id": str(user_id),
                    "business_unit_id": str(business_unit_id),
                    "role_id": str(current_active.role_id),
                },
                status="SUCCESS",
            )

        if new_role_id is None:
            return None

        # Case 3: activate (or create) a UserRole row for new_role_id.
        # Prefer re-activating a matching revoked row (preserves
        # assigned_at/assigned_by audit history from the original
        # assignment) over creating a fresh one.
        existing_revoked = (
            UserRole.objects
            .filter(
                user_id=user_id, business_unit_id=business_unit_id,
                role_id=new_role_id, is_active=False,
            )
            .order_by("-revoked_at")
            .first()
        )

        if existing_revoked is not None:
            existing_revoked.is_active = True
            existing_revoked.revoked_at = None
            existing_revoked.save(update_fields=["is_active", "revoked_at"])
            new_user_role = existing_revoked
            audit_action = "REACTIVATE"
        else:
            new_user_role = UserRole.objects.create(
                user_id=user_id,
                business_unit_id=business_unit_id,
                role_id=new_role_id,
                is_active=True,
                assigned_by_id=actor_user_id,
            )
            audit_action = "ASSIGN"

        AuditService.record(
            action=audit_action,
            resource="rbac.UserRole",
            resource_id=str(new_user_role.id),
            changes={
                "user_id": str(user_id),
                "business_unit_id": str(business_unit_id),
                "role_id": str(new_role_id),
                "assigned_by_id": str(actor_user_id) if actor_user_id else None,
            },
            status="SUCCESS",
        )

        return new_user_role
