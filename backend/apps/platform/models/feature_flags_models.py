# yss_orbit\backend\apps\feature_flags\feature_flag_model.py
"""
YSS Orbit — Feature Flag Model
Platform-level model (not tenant-scoped) that controls feature availability
per organization, plan, or via percentage-based rollout.

Examples:
    'payroll.bulk_run'     — Payroll bulk processing
    'inventory.ai_reorder' — AI-powered reorder suggestions
    'hrms.advanced_shifts' — Advanced shift scheduling
"""
from __future__ import annotations

import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class FeatureFlag(models.Model):
    """
    Platform-level feature toggle.

    Evaluation order (first matching rule wins):
      1. Flag inactive → False
      2. is_enabled_globally → True
      3. organization_id in allowed_organizations → True
      4. plan_code in allowed_plans → True
      5. hash(organization_id) % 100 < rollout_percentage → True
      6. → False

    Platform-level (no business_unit_id) — shared across all tenants.
    Use FeatureFlagService.is_enabled() — never query this model directly.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text=(
            "Dot-notation feature code. e.g. 'payroll.bulk_run'. "
            "Must be stable — used as cache key and in code."
        ),
    )
    name = models.CharField(
        max_length=200,
        help_text="Human-readable feature name for admin display.",
    )
    description = models.TextField(
        blank=True,
        help_text="What this feature enables and any caveats.",
    )

    # ─── Targeting rules ─────────────────────────────────────────────────────

    is_enabled_globally = models.BooleanField(
        default=False,
        db_index=True,
        help_text="If True, all organizations have this feature regardless of other rules.",
    )
    rollout_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=(
            "Percentage (0-100) of organizations to include via hash-based rollout. "
            "0 = no rollout, 100 = all organizations."
        ),
    )
    allowed_organizations = models.JSONField(
        default=list,
        help_text="List of organization UUID strings explicitly allowed to use this feature.",
    )
    allowed_plans = models.JSONField(
        default=list,
        help_text="List of subscription plan codes (str) that have this feature enabled.",
    )

    # ─── Lifecycle ───────────────────────────────────────────────────────────

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Master switch — if False the flag evaluates to False for everyone.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "feature_flags"
        ordering = ["code"]
        indexes = [
            models.Index(fields=["is_active", "is_enabled_globally"]),
        ]

    def __str__(self) -> str:
        status = "ENABLED" if self.is_enabled_globally else f"ROLLOUT:{self.rollout_percentage}%"
        return f"FeatureFlag({self.code} / {status} / active={self.is_active})"
