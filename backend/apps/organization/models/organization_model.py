# yss_orbit/backend/apps/organization/models/organization_model.py
"""
YSS Orbit — Organization Model
Top-level tenant / account entity.

Purpose: Identifies WHO the customer is and provides locale defaults.
It does NOT store operational details — those live on the Business Unit.

Rule of thumb:
  Organization = "the company account on YSS Orbit"
  Business Unit = "the actual store / branch / office that runs daily operations"

CHANGES (Enterprise Audit):
  - Removed `slug` field (per project-wide slug removal policy, matching BusinessDomain migration 0003).
  - Added `restored_at`, `restored_by_id` for audit trail parity with BusinessDomain.
  - Added db_index=True on owner_id for query performance.
  - Added composite indexes: (business_domain_id, is_active), email.
  - Removed slug auto-generation from save().
"""
from __future__ import annotations

from django.db import models

from apps.platform.models.base import PlatformModel


class Organization(PlatformModel):
    """
    The top-level tenant entity. One paying customer = one Organization.
    Provides multi-tenant isolation boundaries for all YSS Orbit resources.
    Does NOT inherit from TenantModel — this *is* the tenant boundary definition.

    Keep this model LEAN. All operational / compliance / address details
    belong on BusinessUnit.
    """

    business_domain = models.ForeignKey(
        "organization.BusinessDomain",
        on_delete=models.RESTRICT,
        null=False,
        blank=False,
        related_name="organization_set",
        help_text="The industry classification of the customer.",
    )

    # ─── IDENTITY ─────────────────────────────────────────────────────────────
    name     = models.CharField(max_length=255, db_index=True)
    logo_url = models.CharField(max_length=500, null=True, blank=True)

    # ─── PLATFORM CONTACT ─────────────────────────────────────────────────────
    # Corporate contact for billing / platform notifications.
    email = models.EmailField(blank=True, default="", db_index=True)
    phone = models.CharField(max_length=50, blank=True, default="")

    # ─── HQ ADDRESS ───────────────────────────────────────────────────────────
    # Corporate Headquarters / Registered Address
    headquarters_address_1 = models.CharField(max_length=255, blank=True, default="")
    headquarters_address_2 = models.CharField(max_length=255, blank=True, default="")
    city                   = models.CharField(max_length=100, blank=True, default="")
    state                  = models.CharField(max_length=100, blank=True, default="")
    country                = models.CharField(max_length=100, blank=True, default="")
    postal_code            = models.CharField(max_length=20,  blank=True, default="")

    # ─── LOCALE DEFAULTS ──────────────────────────────────────────────────────
    timezone      = models.CharField(max_length=64, blank=True, default="Asia/Kolkata")
    currency_code = models.CharField(max_length=3,  blank=True, default="INR")

    # ─── PLATFORM REFERENCES (loose FKs — no DB constraint) ───────────────────
    owner_id = models.UUIDField(null=True, blank=True, db_index=True)

    # ─── RESTORE AUDIT ────────────────────────────────────────────────────────
    # Set when an archived organization is restored. Matches BusinessDomain pattern.
    restored_at     = models.DateTimeField(null=True, blank=True)
    restored_by_id  = models.UUIDField(null=True, blank=True)
    restored_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "organization_organizations"
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"],                       name="org_name_idx"),
            models.Index(fields=["is_active", "is_deleted"],   name="org_status_idx"),
            models.Index(fields=["business_domain_id", "is_active"], name="org_domain_active_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(is_deleted=False),
                name="unique_active_organization_name",
            )
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if self.pk:
            old_domain_id = (
                Organization.objects
                .filter(pk=self.pk)
                .values_list("business_domain_id", flat=True)
                .first()
            )
            if old_domain_id and old_domain_id != self.business_domain_id:
                if self.business_units.exists():
                    from django.core.exceptions import ValidationError
                    raise ValidationError({
                        "business_domain": (
                            "Cannot change the business domain of an organization "
                            "that already has business units."
                        )
                    })

        super().save(*args, **kwargs)
