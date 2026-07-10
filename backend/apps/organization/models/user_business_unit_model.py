# apps/organization/models/user_business_unit_model.py
# ENTERPRISE AUDIT:
#   - Added single-column user_id index for fast auth/lookup queries.
#   - Removed stale "migration intent" comment block (belongs in changelog, not model).
#   - UniqueConstraint supports role-based multi-membership (B27).
from django.db import models
from apps.platform.models.base import BaseModel


class UserBusinessUnitModel(BaseModel):
    """
    Junction model: User ↔ BusinessUnit membership.
    A user can belong to multiple BUs; each membership carries an optional Role.

    CONSTRAINT: unique_active_user_business_unit_role — only one active membership
    per (user, business_unit, role) combination. Users can be re-invited after
    soft-delete + restore cycles (partial constraint on is_deleted=False).
    """
    user = models.ForeignKey(
        "iam.User",
        on_delete=models.CASCADE,
        related_name="bu_memberships_new",
    )
    business_unit = models.ForeignKey(
        "organization.BusinessUnit",
        on_delete=models.CASCADE,
        related_name="user_memberships_new",
    )
    role = models.ForeignKey(
        "iam.Role",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    is_active_membership = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    # B27: Temporary Assignments
    effective_from = models.DateTimeField(null=True, blank=True, help_text="Assignment active from this date/time")
    effective_to   = models.DateTimeField(null=True, blank=True, help_text="Assignment active until this date/time")

    class Meta(BaseModel.Meta):
        db_table = "ubu_memberships"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "business_unit", "role"],
                condition=models.Q(is_deleted=False),
                name="unique_active_user_business_unit_role",
            )
        ]
        indexes = [
            # ENTERPRISE AUDIT: Single-column user_id index for fast auth lookups.
            models.Index(fields=["user"],                                   name="ubu_user_id_idx"),
            models.Index(fields=["user", "is_active_membership"],           name="ubu_user_active_idx"),
            models.Index(fields=["business_unit", "is_active_membership"],  name="ubu_bu_active_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user} → {self.business_unit} [{self.role}]"
