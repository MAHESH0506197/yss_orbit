# yss_orbit\backend\apps\rbac\models.py
"""
YSS Orbit — RBAC Models
Roles and permissions for fine-grained access control.
Permission codes are lowercase dot-notation: "inventory.items.create"
"""
from __future__ import annotations

import uuid

from django.db import models

from core.base.base_model import BaseModel
from apps.platform.models.base import PlatformModel, TenantModel


class Permission(models.Model):
    """
    Immutable permission registry. Seeded from code — not user-editable.
    Format: "module.resource.action" e.g. "inventory.items.create"
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=150, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    module = models.CharField(max_length=50, db_index=True)  # e.g. "inventory"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rbac_permissions"
        ordering = ["module", "code"]

    def __str__(self) -> str:
        return self.code


class Role(BaseModel):
    """
    Role definition scoped to a business domain.
    System roles (OWNER, ADMIN, MANAGER, STAFF) cannot be deleted.
    Custom roles can be created by ADMIN users.
    """

    class RoleType(models.TextChoices):
        SYSTEM = "SYSTEM", "System Role"
        CUSTOM = "CUSTOM", "Custom Role"

    business_unit_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="The business unit this role belongs to. Prevents cross-tenant assignment.",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    role_type = models.CharField(
        max_length=10,
        choices=RoleType.choices,
        default=RoleType.CUSTOM,
    )
    module_code = models.CharField(
        max_length=50,
        db_index=True,
        null=True,
        blank=True,
        help_text="The primary module this role belongs to (e.g. 'payroll', 'hrms')",
    )
    department_name = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        help_text="Optional department name for grouping roles within a Business Unit",
    )
    is_default = models.BooleanField(default=False)  # Default role for new members
    permissions = models.ManyToManyField(
        Permission,
        through="RolePermission",
        blank=True,
    )
    source_template = models.ForeignKey(
        "RoleTemplate",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="derived_roles",
        help_text=(
            "The RoleTemplate this role was instantiated from. "
            "Null for system roles and scratch custom roles. "
            "Informational only — changing the template does NOT update this role."
        ),
    )

    class Meta(BaseModel.Meta):
        db_table = "rbac_roles"
        unique_together = [("business_unit_id", "name")]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.business_unit_id})"

    def get_permission_codes(self) -> frozenset[str]:
        """Returns frozenset of permission codes for O(1) lookup."""
        return frozenset(
            self.permissions.filter(is_active=True).values_list("code", flat=True)
        )


class RolePermission(BaseModel):
    """
    Through table for Role ↔ Permission M2M.

    Extends BaseModel for enterprise-grade audit trail:
      - is_active / is_deleted: soft revocation without data loss
      - created_by_id: who granted the permission (formerly granted_by_id)
      - created_at: when it was granted (formerly granted_at)
      - updated_by_id / deleted_by_id: who last changed / revoked it
      - all_objects: manager to query including revoked rows (audit queries)

    UniqueConstraint is partial (is_deleted=False only) so that a revoked
    permission can be re-granted later without violating uniqueness.
    """

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")

    class Meta(BaseModel.Meta):
        db_table = "rbac_role_permissions"
        constraints = [
            models.UniqueConstraint(
                fields=["role", "permission"],
                condition=models.Q(is_deleted=False),
                name="unique_active_role_permission",
            )
        ]
        indexes = [
            models.Index(fields=["role", "is_active", "is_deleted"]),
            models.Index(fields=["permission", "is_deleted"]),
        ]

    def __str__(self) -> str:
        return f"{self.role} → {self.permission} (active={self.is_active})"


class UserRole(models.Model):
    """
    Assigns a Role to a User within a Business Unit.
    A user can have exactly one ACTIVE role per BU (change via role reassignment).

    2.3 fix: Added UniqueConstraint on (user_id, business_unit_id) for active assignments.
    This prevents concurrent requests from creating duplicate active role assignments.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    business_unit_id = models.UUIDField(db_index=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="user_roles")
    is_active = models.BooleanField(default=True)
    assigned_by_id = models.UUIDField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "rbac_user_roles"
        indexes = [
            models.Index(fields=["user_id", "business_unit_id", "is_active"]),
        ]
        constraints = [
            # 2.3 fix: DB-level uniqueness — one active role per user per BU.
            # Partial unique index (only applies when is_active=True) allows
            # historical records (revoked roles) to coexist without violating uniqueness.
            models.UniqueConstraint(
                fields=["user_id", "business_unit_id"],
                condition=models.Q(is_active=True),
                name="unique_active_role_per_user_per_bu",
            ),
        ]


class UserPermissionOverride(models.Model):
    """
    Per-user permission override.
    Overrides role-based permissions by explicitly granting or revoking a specific permission.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(db_index=True)
    business_unit_id = models.UUIDField(db_index=True)
    permission_code = models.CharField(max_length=150, db_index=True)
    is_grant = models.BooleanField(
        help_text="True to explicitly grant, False to explicitly revoke."
    )
    granted_by_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rbac_user_permission_overrides"
        constraints = [
            models.UniqueConstraint(
                fields=["user_id", "business_unit_id", "permission_code"],
                name="unique_override_per_user_bu_permission",
            )
        ]

    def __str__(self) -> str:
        action = "GRANT" if self.is_grant else "REVOKE"
        return f"{action} {self.permission_code} for user {self.user_id}"


class RoleTemplate(PlatformModel):
    """
    Standard Role Templates defined at the platform level (per module).
    Used as blueprints to create Business Unit specific roles.
    """
    module_code = models.CharField(max_length=50, db_index=True, help_text="e.g. 'payroll', 'hrms', 'attendance'")
    name = models.CharField(max_length=100, help_text="e.g. 'Payroll Admin', 'HR Manager'")
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(
        Permission,
        through="RoleTemplatePermission",
        blank=True,
    )

    class Meta(PlatformModel.Meta):
        db_table = "rbac_role_templates"
        unique_together = [("module_code", "name")]
        ordering = ["module_code", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.module_code})"


class RoleTemplatePermission(models.Model):
    """Through table for RoleTemplate ↔ Permission M2M."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(RoleTemplate, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rbac_role_template_permissions"
        unique_together = [("template", "permission")]


class RbacModule(BaseModel):
    """
    Top-level logical group of Role Templates (e.g., HR & Payroll, Finance & Billing).
    """
    code = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "rbac_modules"
        ordering = ["title"]

    def __str__(self) -> str:
        return f"{self.title} ({self.code})"


class RbacSubModule(BaseModel):
    """
    Sub-level logical group (e.g., Core HR, Payroll) inside an RbacModule.
    RoleTemplates belong to a SubModule.
    """
    code = models.CharField(max_length=50, unique=True, db_index=True)
    parent_module = models.ForeignKey(RbacModule, on_delete=models.CASCADE, related_name="sub_modules")
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "rbac_sub_modules"
        ordering = ["parent_module", "title"]

    def __str__(self) -> str:
        return f"{self.title} ({self.code})"

