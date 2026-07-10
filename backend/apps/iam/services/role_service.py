# yss_orbit/backend/apps/rbac/services/role_service.py
import logging
import uuid
from typing import Dict, Any, Optional

from django.db import transaction

from apps.platform.core_exceptions import ResourceNotFoundException, ValidationException
from apps.iam.security_context import SecurityContext
from apps.iam.models.rbac_models import Role
from apps.iam.repositories.role_repository import RoleRepository

logger = logging.getLogger(__name__)

class RoleService:
    """
    Enterprise-grade Service for Role management.
    Handles business logic and audit tracking for Roles.
    """

    def __init__(self):
        self.repository = RoleRepository()
        try:
            from core.audit.audit_service import AuditService
            self.audit_service = AuditService
        except ImportError:
            self.audit_service = None

    @transaction.atomic
    def create_role(
        self,
        security_context: SecurityContext,
        business_unit_id: uuid.UUID,
        name: str,
        description: str = "",
        is_default: bool = False,
        module_code: Optional[str] = None,
        department_name: Optional[str] = None,
    ) -> Role:
        """Create a CUSTOM role scoped to a business unit.

        BUG-RP-08 fix: ``module_code`` is now accepted and persisted so that
        the role is categorised correctly in the Roles & Permissions UI.
        """
        role = self.repository.create(
            business_unit_id=business_unit_id,
            name=name,
            description=description,
            department_name=department_name,
            role_type=Role.RoleType.CUSTOM,
            is_default=is_default,
            module_code=module_code,
            created_by_id=security_context.effective_user_id,
            updated_by_id=security_context.effective_user_id,
        )
        logger.info(
            "Created custom role '%s' (id=%s) module=%s in BU %s",
            name, role.id, module_code, business_unit_id,
        )

        if self.audit_service:
            self.audit_service.record(
                action="CREATE",
                resource="rbac.Role",
                resource_id=str(role.id),
                changes={
                    "name": name,
                    "module_code": module_code,
                    "department_name": department_name,
                    "business_unit_id": str(business_unit_id),
                },
                status="SUCCESS",
            )

        return role

    @transaction.atomic
    def update_role(
        self,
        security_context: SecurityContext,
        role_id: uuid.UUID,
        data: Dict[str, Any],
    ) -> Role:
        role = self.repository.get_by_id(role_id)
        if not role:
            raise ResourceNotFoundException(f"Role {role_id} not found.")

        if role.role_type == Role.RoleType.SYSTEM:
            raise ValidationException("Cannot update system roles.")

        update_kwargs = {}
        for key in ["name", "description", "is_default", "module_code", "department_name"]:
            if key in data:
                update_kwargs[key] = data[key]
                
        update_kwargs["updated_by_id"] = security_context.effective_user_id
        
        role = self.repository.update(role, **update_kwargs)
        logger.info("Updated custom role (id=%s)", role.id)
        
        if self.audit_service:
            self.audit_service.record(
                action="UPDATE",
                resource="rbac.Role",
                resource_id=str(role.id),
                changes=update_kwargs,
                status="SUCCESS"
            )
            
        return role

    @transaction.atomic
    def delete_role(
        self,
        security_context: SecurityContext,
        role_id: uuid.UUID,
    ) -> None:
        role = self.repository.get_by_id(role_id)
        if not role:
            raise ResourceNotFoundException(f"Role {role_id} not found.")

        if role.role_type == Role.RoleType.SYSTEM:
            raise ValidationException("Cannot delete system roles.")

        # Soft delete is handled by TenantModel / Repository
        role.deleted_by_id = security_context.effective_user_id
        self.repository.delete(role)

        # QUALITY-RP-08 fix: deactivate related UserRoles and audit the cascade.
        from apps.iam.models.rbac_models import UserRole
        from django.utils import timezone as tz
        affected_user_roles = list(
            UserRole.objects.filter(role_id=role.id, is_active=True)
            .values_list("id", "user_id", "business_unit_id")
        )
        UserRole.objects.filter(role_id=role.id, is_active=True).update(
            is_active=False, revoked_at=tz.now()
        )
        logger.info(
            "Soft-deleted role (id=%s) — deactivated %d UserRole assignment(s).",
            role.id, len(affected_user_roles),
        )

        if self.audit_service:
            self.audit_service.record(
                action="DELETE",
                resource="rbac.Role",
                resource_id=str(role.id),
                changes={
                    "name": role.name,
                    "cascade_revoked_user_role_ids": [
                        str(ur_id) for ur_id, _, _ in affected_user_roles
                    ],
                },
                status="SUCCESS",
            )

    @transaction.atomic
    def assign_permissions(
        self,
        security_context: SecurityContext,
        role_id: uuid.UUID,
        permission_ids: list[uuid.UUID]
    ) -> None:
        """
        Idempotently synchronises a role's permission set.

        Algorithm (race-safe, audit-preserving):
          1. Lock all existing RolePermission rows for this role (SELECT FOR UPDATE).
          2. Compute diff: to_add = requested - current, to_remove = current - requested.
          3. Revoke removed rows via soft_delete() (preserves history, sets is_active=False).
          4. For additions:
             a. If a soft-deleted row exists for (role, permission), restore it.
             b. Otherwise create a new row.
          5. Invalidate RBAC cache for all users who hold this role.
        """
        role = self.repository.get_by_id(role_id)
        if not role:
            raise ResourceNotFoundException(f"Role {role_id} not found.")

        if role.role_type == Role.RoleType.SYSTEM:
            raise ValidationException("Cannot modify permissions of system roles.")

        from apps.iam.models.rbac_models import RolePermission, Permission

        # Verify all requested permission IDs are valid + active
        valid_perm_ids = set(
            Permission.objects.filter(id__in=permission_ids, is_active=True)
            .values_list("id", flat=True)
        )

        # Lock current active RolePermission rows to prevent race conditions
        current_rp_rows = list(
            RolePermission.objects.select_for_update()
            .filter(role_id=role.id, is_deleted=False)
            .values_list("permission_id", flat=True)
        )
        current_perm_ids = set(current_rp_rows)

        to_add = valid_perm_ids - current_perm_ids
        to_remove = current_perm_ids - valid_perm_ids

        if not to_add and not to_remove:
            logger.debug("No permission changes needed for role (id=%s)", role.id)
            return

        # Revoke removed permissions (soft-delete for full audit trail)
        if to_remove:
            for rp in RolePermission.objects.filter(
                role_id=role.id, permission_id__in=to_remove, is_deleted=False
            ):
                rp.soft_delete(deleted_by_id=security_context.effective_user_id)

        # Grant new permissions
        bulk_create_rows = []
        for perm_id in to_add:
            # Check for a previously revoked row — restore it (avoids duplicate rows)
            revoked = RolePermission.all_objects.filter(
                role_id=role.id,
                permission_id=perm_id,
                is_deleted=True
            ).first()
            if revoked:
                revoked.restore()
                revoked.updated_by_id = security_context.effective_user_id
                revoked.save(update_fields=["is_active", "is_deleted", "deleted_at", "deleted_by_id", "updated_by_id"])
            else:
                bulk_create_rows.append(
                    RolePermission(
                        role_id=role.id,
                        permission_id=perm_id,
                        created_by_id=security_context.effective_user_id,
                        updated_by_id=security_context.effective_user_id,
                    )
                )

        if bulk_create_rows:
            RolePermission.objects.bulk_create(bulk_create_rows, ignore_conflicts=False)

        logger.info(
            "Permission sync complete for role (id=%s): +%d granted, -%d revoked",
            role.id, len(to_add), len(to_remove),
        )

        # Invalidate RBAC permission cache for all users holding this role
        from apps.iam.models.rbac_models import UserRole
        from apps.iam.services.rbac_service import RBACService
        affected_users = UserRole.objects.filter(
            role_id=role.id, is_active=True
        ).values_list("user_id", "business_unit_id")
        for user_id, bu_id in affected_users:
            RBACService.invalidate_user_permissions(user_id, bu_id)

        if self.audit_service:
            self.audit_service.record(
                action="ASSIGN_PERMISSIONS",
                resource="rbac.Role",
                resource_id=str(role.id),
                changes={
                    "granted_permission_ids": [str(p) for p in to_add],
                    "revoked_permission_ids": [str(p) for p in to_remove],
                },
                status="SUCCESS",
            )

