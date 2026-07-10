# yss_orbit/backend/apps/organization/models/organization_settings_model.py
"""
YSS Orbit — Organization Settings Model
Global UI/UX and security configuration for a specific organization.

ENTERPRISE AUDIT CHANGE (Q3 approved):
  Converted from plain `models.Model` to `BaseModel` for:
  - UUID primary key (consistent with all other module models)
  - Soft-delete support (is_deleted, deleted_at, deleted_by_id)
  - Audit trail fields (created_by_id, updated_by_id)
  - SoftDeleteManager (objects / all_objects)
  Requires migration 0005 to update the DB schema.
"""
from __future__ import annotations

from django.db import models

from apps.organization.models.organization_model import Organization
from apps.platform.models.base import BaseModel


class OrganizationSettings(BaseModel):
    """
    Per-organization configuration for theming, locale, and security.
    Created automatically when an Organization is provisioned.

    Inherits from BaseModel:
      - UUID primary key
      - is_active, is_deleted, deleted_at, deleted_by_id
      - created_at, updated_at, created_by_id, updated_by_id
      - SoftDeleteManager (objects / all_objects)
    """

    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="settings",
    )

    # ─── BRANDING ─────────────────────────────────────────────────────────────

    # ─── SECURITY ─────────────────────────────────────────────────────────────
    require_mfa             = models.BooleanField(default=False)
    session_timeout_minutes = models.IntegerField(default=60)
    allowed_ip_ranges       = models.JSONField(default=list, blank=True)

    # ─── FEATURES ─────────────────────────────────────────────────────────────
    enable_audit_log  = models.BooleanField(default=True)
    enable_api_access = models.BooleanField(default=False)
    max_users         = models.IntegerField(null=True, blank=True, help_text="Null = unlimited")

    # ─── NOTIFICATIONS ────────────────────────────────────────────────────────
    notify_on_login       = models.BooleanField(default=False)
    notify_on_data_export = models.BooleanField(default=True)

    class Meta:
        db_table = "organization_settings"
        verbose_name = "Organization Settings"
        verbose_name_plural = "Organization Settings"

    def __str__(self) -> str:
        return f"Settings for {self.organization.name}"
