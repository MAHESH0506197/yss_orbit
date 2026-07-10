# apps/organization/models/business_unit_model.py
# ENTERPRISE AUDIT: Added restored_at/by/reason fields (parity with BusinessDomain/Organization).
# Added is_main_branch index, deleted_reason preservation.
# Added unique-name-per-org constraint.
from __future__ import annotations
import uuid
from django.db import models
from django.db.models import Q
from apps.platform.models import BaseModel
from apps.organization.models.organization_model import Organization


class BusinessUnit(BaseModel):
    """
    Operational entity within an Organization.
    Represents a store, branch, office, or department.
    ALL tenant-scoped data carries business_unit_id.
    NAMING RULE: Called 'Business Unit' — NEVER 'Domain'
    """

    organization = models.ForeignKey(
        Organization,
        on_delete=models.RESTRICT,
        related_name="business_units",
        db_index=True,
    )
    name = models.CharField(max_length=255)
    # FIX-BUG01: No RegexValidator — serializer enforces CODE_REGEX pattern
    # ^[A-Z0-9_-]{2,20}$ (no 'BU-' prefix requirement)
    code = models.CharField(
        max_length=20,
        help_text="2-20 uppercase alphanumeric chars. Validated by serializer.",
    )

    # BU classification is now inherited from the Organization.
    # The direct ForeignKey has been removed. Use the properties below.

    # ─── CONTACT ─────────────────────────────────────────────────────────────
    email   = models.EmailField(blank=True, default="")
    phone   = models.CharField(max_length=20, blank=True, default="")

    # ─── ADDRESS ─────────────────────────────────────────────────────────────
    address_line1 = models.CharField(max_length=255, blank=True, default="")
    address_line2 = models.CharField(max_length=255, blank=True, default="")
    city          = models.CharField(max_length=100, blank=True, default="")
    state         = models.CharField(max_length=100, blank=True, default="")
    country       = models.CharField(max_length=2, default="IN")
    pincode       = models.CharField(max_length=10, blank=True, default="")

    # ─── COMPLIANCE / LEGAL ──────────────────────────────────────────────────
    registration_number = models.CharField(max_length=100, blank=True, default="")
    gst_number          = models.CharField(max_length=20, blank=True, default="")
    pan_number          = models.CharField(max_length=20, blank=True, default="")

    # ─── LOCALE (overrides org-level defaults) ───────────────────────────────
    timezone      = models.CharField(max_length=64, blank=True, default="")
    currency_code = models.CharField(max_length=3, blank=True, default="")

    # ─── BRANDING ────────────────────────────────────────────────────────────
    logo_url      = models.CharField(max_length=500, blank=True, null=True)

    # ─── REFERENCES ──────────────────────────────────────────────────────────
    manager_id = models.UUIDField(null=True, blank=True)

    # ─── FLAGS ───────────────────────────────────────────────────────────────
    is_main_branch = models.BooleanField(
        default=False,
        help_text="Only one main branch allowed per organization.",
    )

    # ─── RESTORE AUDIT ────────────────────────────────────────────────────────
    # Parity with BusinessDomain and Organization restore audit fields.
    restored_at     = models.DateTimeField(null=True, blank=True)
    restored_by_id  = models.UUIDField(null=True, blank=True)
    restored_reason = models.TextField(blank=True, default="")

    # ─── SOFT-DELETE TRACKING ────────────────────────────────────────────────
    cascade_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text=(
            "True when this BU was soft-deleted via parent Organization cascade. "
            "Allows selective restore when the parent org is restored."
        ),
    )

    class Meta(BaseModel.Meta):
        db_table = "business_units"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["organization", "is_active"], name="bu_org_active_idx"),
            models.Index(fields=["organization", "code"],      name="bu_org_code_idx"),
            models.Index(fields=["is_deleted"],                name="bu_is_deleted_idx"),
            # ENTERPRISE AUDIT: Added index on is_main_branch for fast main-branch lookups.
            models.Index(fields=["is_main_branch"],            name="bu_main_branch_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"],
                condition=Q(is_deleted=False),
                name="unique_bu_code_per_org",
            ),
            models.UniqueConstraint(
                fields=["organization"],
                condition=Q(is_main_branch=True, is_deleted=False),
                name="unique_main_branch_per_organization",
            ),
            # ENTERPRISE AUDIT: Enforce name uniqueness within an org (soft-delete aware).
            models.UniqueConstraint(
                fields=["organization", "name"],
                condition=Q(is_deleted=False),
                name="unique_bu_name_per_org",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"

    @property
    def effective_timezone(self) -> str:
        if self.timezone:
            return self.timezone
        try:
            return self.organization.timezone or "Asia/Kolkata"
        except Exception:
            return "Asia/Kolkata"

    @property
    def effective_currency(self) -> str:
        if self.currency_code:
            return self.currency_code
        try:
            return self.organization.currency_code or "INR"
        except Exception:
            return "INR"

    @property
    def business_domain_id(self) -> "uuid.UUID | None":
        """Computed from parent Organization. Not a direct DB column."""
        try:
            return self.organization.business_domain_id
        except Exception:
            return None

    @property
    def business_domain(self):
        """Computed from parent Organization. Not a direct DB column."""
        try:
            return self.organization.business_domain
        except Exception:
            return None
