# yss_orbit\backend\apps\business_unit\models\business_unit_module.py
from __future__ import annotations

import uuid
from django.db import models
from django.utils import timezone

from apps.platform.models.base import TenantModel


class BusinessUnitModule(TenantModel):
    """
    Tracks which platform modules are actively subscribed and enabled
    for a specific Business Unit (tenant). 
    Enforces Rulebook E04 constraints.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        TRIAL = "trial", "Trial"
        SUSPENDED = "suspended", "Suspended"
        EXPIRED = "expired", "Expired"

    # NOTE: Do NOT re-declare 'id' here — TenantModel → BaseModel already
    # declares id = models.UUIDField(primary_key=True, ...). Declaring it
    # again (DEFECT-08) would shadow the parent and risk migration drift.

    # We reference the PlatformModule string code directly or via ForeignKey.
    # Since PlatformModule is in `apps.tenancy`, we use a string reference
    # to avoid circular imports, or we can use a ForeignKey 'tenancy.PlatformModule'.
    module = models.ForeignKey(
        "tenancy.PlatformModule",
        on_delete=models.PROTECT,
        related_name="active_business_units",
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    
    plan_limit = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Custom plan overrides for this specific module/tenant."
    )
    
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    activated_by = models.ForeignKey(
        "iam.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_modules",
    )

    class Meta:
        db_table = "business_unit_module"
        verbose_name = "Business Unit Module"
        verbose_name_plural = "Business Unit Modules"
        constraints = [
            models.UniqueConstraint(
                fields=["business_unit_id", "module"],
                name="unique_business_unit_module"
            )
        ]
        indexes = [
            models.Index(fields=["status", "business_unit_id"], name="bum_status_bu_idx"),
            models.Index(fields=["module", "status"],          name="bum_module_status_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.module} for BU {self.business_unit_id}"

    @property
    def is_module_active(self) -> bool:
        """
        Returns True if the module subscription is currently active and not expired.
        Renamed from is_active (MED-03) to avoid shadowing the BaseModel is_active DB column,
        which would cause .filter(is_active=...) to operate on the DB column while Python
        code sees the property — a silent and dangerous inconsistency.
        """
        if self.status not in (self.Status.ACTIVE, self.Status.TRIAL):
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
