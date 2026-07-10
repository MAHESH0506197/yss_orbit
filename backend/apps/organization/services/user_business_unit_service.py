# yss_orbit\backend\apps\user_business_unit\services\user_business_unit_service.py
"""
UserBusinessUnit Service — orchestrates membership business logic.

FIX-BUG36 (CRITICAL): UserRole (rbac_user_roles table) and
UserBusinessUnitModel.role (a plain FK, set here) were never synced.
When a user was assigned a role via the User-BU mapping API
(UserBusinessUnitViewSet), UserBusinessUnitModel.role_id was set but the
corresponding UserRole row (the table RBACService.get_user_permissions_
as_frozenset() reads via UserRoleRepository.get_active_for_user_in_bu)
was NOT created/updated/revoked. The net effect: role assignment via the
UI/API had ZERO effect on the user's actual permissions.

FIX: RoleAssignmentService.sync_user_role() is now called at ALL 5 touch
points:
  1. create_membership   — creates UserRole if role_id given
  2. update_membership   — syncs UserRole on role_id change (revoke old,
                           assign new) or deactivates it if role_id cleared
  3. deactivate_membership — revokes UserRole (user loses permissions while
                             membership is inactive, matching expected UX)
  4. activate_membership   — re-assigns UserRole from membership.role_id
                             (restores permissions on re-activation)
  5. delete_membership     — revokes UserRole permanently (soft-delete of
                             membership = user should not be accessible in
                             any BU context again)

Cache invalidation comes for free: apps/rbac/signals.py already wires
UserRole post_save/post_delete → RBACService.invalidate_user_permissions()
— so HasRBACPermission sees the new state on the next request.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

from django.db import transaction

from apps.iam.security_context import SecurityContext
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
from apps.organization.repositories.user_business_unit_repository import UserBusinessUnitRepository
from apps.organization.events.events import (
    MembershipCreatedEvent,
    MembershipUpdatedEvent,
    MembershipDeactivatedEvent,
    MembershipTransferredEvent,
)
from apps.organization.events.event_handlers import (
    handle_membership_created,
    handle_membership_updated,
    handle_membership_deactivated,
    handle_membership_transferred,
)
from apps.iam.services.role_assignment_service import RoleAssignmentService

logger = logging.getLogger(__name__)


class UserBusinessUnitService:
    """
    Service layer for User–Business-Unit memberships.
    Handles create, update, activate/deactivate, and delete operations.
    """

    def __init__(self):
        self.repository = UserBusinessUnitRepository()

    # ── Create ────────────────────────────────────────────────────────────────

    @transaction.atomic
    def create_membership(
        self,
        security_context: SecurityContext,
        user_id: uuid.UUID,
        business_unit_id: uuid.UUID,
        role_id: Optional[uuid.UUID] = None,
        effective_from: Optional[Any] = None,
        effective_to: Optional[Any] = None,
    ) -> UserBusinessUnitModel:
        """
        Creates a new User–BU membership.
        Raises ValueError if one already exists.

        FIX-BUG36 (touch point 1): after saving the membership row,
        sync_user_role() is called to create the corresponding UserRole
        row — the actual permission-granting row RBACService reads.
        """
        if UserBusinessUnitModel.objects.filter(
            user_id=user_id, business_unit_id=business_unit_id, role_id=role_id, is_deleted=False
        ).exists():
            raise ValueError(
                f"User {user_id} is already a member of business unit {business_unit_id} with role {role_id}."
            )

        # Domain Validation (B27)
        if role_id:
            from apps.iam.models.rbac_models import Role
            from apps.organization.models import BusinessUnit
            role = Role.objects.get(id=role_id)
            bu = BusinessUnit.objects.select_related("organization").get(id=business_unit_id)
            role_domain_id = getattr(role, "business_domain_id", None)
            bu_domain_id = getattr(bu.organization, "business_domain_id", None)
            if role_domain_id and bu_domain_id:
                if role_domain_id != bu_domain_id:
                    raise ValueError(f"Domain mismatch: Role domain {role_domain_id} != BU domain {bu_domain_id}")

        membership = self.repository.create(
            user_id=user_id,
            business_unit_id=business_unit_id,
            role_id=role_id,
            is_active_membership=True,
            effective_from=effective_from,
            effective_to=effective_to,
        )

        # FIX-BUG36 touch point 1: sync UserRole row.
        if role_id:
            RoleAssignmentService.sync_user_role(
                user_id=user_id,
                business_unit_id=business_unit_id,
                new_role_id=role_id,
                actor_user_id=getattr(security_context, "effective_user_id", None),
            )

        handle_membership_created(
            MembershipCreatedEvent(
                membership_id=str(membership.id),
                user_id=str(user_id),
                business_unit_id=str(business_unit_id),
                role=str(role_id) if role_id else "none",
            )
        )

        logger.info(
            "Membership created: user=%s BU=%s id=%s role=%s",
            user_id, business_unit_id, membership.id, role_id,
        )
        return membership

    # ── Update ────────────────────────────────────────────────────────────────

    @transaction.atomic
    def update_membership(
        self,
        security_context: SecurityContext,
        membership_id: uuid.UUID,
        data: Dict[str, Any],
    ) -> UserBusinessUnitModel:
        """
        Updates a membership record (role, is_active_membership).

        FIX-BUG36 (touch point 2): if role_id changes (or is cleared),
        sync_user_role() is called to revoke the previous UserRole (if any)
        and create/re-activate the new one (or revoke entirely if
        new role_id is None). This is the most important touch point —
        role REASSIGNMENT was silently broken before this fix.
        """
        membership = self.repository.get_by_id(membership_id)
        if membership is None:
            raise ValueError(f"Membership {membership_id} not found.")

        allowed_fields = {"role_id", "is_active_membership", "effective_from", "effective_to"}
        update_kwargs = {k: v for k, v in data.items() if k in allowed_fields}
        changed_fields = list(update_kwargs.keys())

        old_role_id = membership.role_id
        membership = self.repository.update(membership, **update_kwargs)

        # FIX-BUG36 touch point 2: sync UserRole only if role_id changed.
        new_role_id = update_kwargs.get("role_id", old_role_id)
        role_changed = str(old_role_id) != str(new_role_id)
        
        # Domain Validation (B27)
        if role_changed and new_role_id:
            from apps.iam.models.rbac_models import Role
            from apps.organization.models import BusinessUnit
            role = Role.objects.get(id=new_role_id)
            bu = BusinessUnit.objects.select_related("organization").get(id=membership.business_unit_id)
            if role.business_domain_id and bu.organization.business_domain_id:
                if role.business_domain_id != bu.organization.business_domain_id:
                    raise ValueError("Domain mismatch: Role domain must match BusinessUnit domain.")

        if role_changed and membership.is_active_membership:
            RoleAssignmentService.sync_user_role(
                user_id=membership.user_id,
                business_unit_id=membership.business_unit_id,
                new_role_id=new_role_id,
                actor_user_id=getattr(security_context, "effective_user_id", None),
            )

        handle_membership_updated(
            MembershipUpdatedEvent(
                membership_id=str(membership_id),
                updated_fields=changed_fields,
            )
        )

        logger.info("Membership updated: id=%s fields=%s", membership_id, changed_fields)
        return membership

    # ── Deactivate / Activate ────────────────────────────────────────────────

    @transaction.atomic
    def deactivate_membership(
        self,
        security_context: SecurityContext,
        membership_id: uuid.UUID,
    ) -> UserBusinessUnitModel:
        """
        Soft-deactivates a membership (sets is_active_membership=False).

        FIX-BUG36 (touch point 3): revokes the corresponding UserRole row
        so the user immediately loses BU-scoped permissions on the next
        request (HasRBACPermission re-checks on each request; cache
        invalidated by signals.py's post_save handler).
        """
        membership = self.repository.get_by_id(membership_id)
        if membership is None:
            raise ValueError(f"Membership {membership_id} not found.")

        membership = self.repository.update(membership, is_active_membership=False)

        # FIX-BUG36 touch point 3: revoke UserRole on deactivation.
        RoleAssignmentService.sync_user_role(
            user_id=membership.user_id,
            business_unit_id=membership.business_unit_id,
            new_role_id=None,  # None = revoke any active UserRole
            actor_user_id=getattr(security_context, "effective_user_id", None),
        )

        handle_membership_deactivated(
            MembershipDeactivatedEvent(membership_id=str(membership_id))
        )

        logger.info("Membership deactivated: id=%s", membership_id)
        return membership

    @transaction.atomic
    def activate_membership(
        self,
        security_context: SecurityContext,
        membership_id: uuid.UUID,
    ) -> UserBusinessUnitModel:
        """
        Re-activates a previously deactivated membership.

        FIX-BUG36 (touch point 4): re-assigns the UserRole from
        membership.role_id so the user's permissions are restored
        immediately on re-activation.
        """
        membership = self.repository.get_by_id(membership_id)
        if membership is None:
            raise ValueError(f"Membership {membership_id} not found.")

        membership = self.repository.update(membership, is_active_membership=True)

        # FIX-BUG36 touch point 4: re-assign UserRole on activation.
        if membership.role_id:
            RoleAssignmentService.sync_user_role(
                user_id=membership.user_id,
                business_unit_id=membership.business_unit_id,
                new_role_id=membership.role_id,
                actor_user_id=getattr(security_context, "effective_user_id", None),
            )

        logger.info("Membership activated: id=%s", membership_id)
        return membership

    # ── Delete ────────────────────────────────────────────────────────────────

    @transaction.atomic
    def delete_membership(
        self,
        security_context: SecurityContext,
        membership_id: uuid.UUID,
    ) -> None:
        """
        Soft-deletes a membership record.

        2.6 fix: B01 §5.5 — Hard delete is FORBIDDEN. Soft-delete preserves
        the record for audit trail (C03 retention compliance).

        FIX-BUG36 (touch point 5): revokes the UserRole row so the user
        immediately loses all BU-scoped permissions on soft-delete. The
        UserRole row itself is NOT deleted (it's an audit record); it's
        simply marked is_active=False, revoked_at=now().
        """
        membership = self.repository.get_by_id(membership_id)
        if membership is None:
            raise ValueError(f"Membership {membership_id} not found.")

        # FIX-BUG36 touch point 5: revoke UserRole before soft-deleting.
        RoleAssignmentService.sync_user_role(
            user_id=membership.user_id,
            business_unit_id=membership.business_unit_id,
            new_role_id=None,
            actor_user_id=getattr(security_context, "effective_user_id", None),
        )

        # 2.6 fix: Soft-delete preserves the record for compliance (C03).
        membership.soft_delete(deleted_by_id=security_context.effective_user_id)
        logger.info(
            "Membership soft-deleted: id=%s by=%s",
            membership_id,
            security_context.effective_user_id,
        )

    # ── Transfer ──────────────────────────────────────────────────────────────

    @transaction.atomic
    def transfer_membership(
        self,
        security_context: SecurityContext,
        membership_id: uuid.UUID,
        new_business_unit_id: uuid.UUID,
        new_role_id: Optional[uuid.UUID] = None,
        effective_from: Optional[Any] = None,
        effective_to: Optional[Any] = None,
    ) -> UserBusinessUnitModel:
        """
        Transfers a user from one BU to another by revoking the old assignment
        and creating a new one (B27).
        """
        old_membership = self.repository.get_by_id(membership_id)
        if old_membership is None:
            raise ValueError(f"Membership {membership_id} not found.")

        old_bu_id = old_membership.business_unit_id
        user_id = old_membership.user_id

        # Revoke old assignment (soft delete)
        self.delete_membership(security_context, membership_id)

        # Create new assignment
        new_membership = self.create_membership(
            security_context=security_context,
            user_id=user_id,
            business_unit_id=new_business_unit_id,
            role_id=new_role_id,
            effective_from=effective_from,
            effective_to=effective_to,
        )

        handle_membership_transferred(
            MembershipTransferredEvent(
                old_membership_id=str(old_membership.id),
                new_membership_id=str(new_membership.id),
                user_id=str(user_id),
                old_business_unit_id=str(old_bu_id),
                new_business_unit_id=str(new_business_unit_id),
            )
        )

        logger.info(
            "Membership transferred: user=%s old_bu=%s new_bu=%s",
            user_id, old_bu_id, new_business_unit_id,
        )
        return new_membership

