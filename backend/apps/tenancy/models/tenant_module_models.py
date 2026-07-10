import uuid
from django.db import models
from apps.platform.models.base import TenantModel
from apps.tenancy.models import SubscriptionPlan

class ModuleStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"

class TenantModule(TenantModel):
    module_code = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=ModuleStatus.choices, default=ModuleStatus.ACTIVE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "tenant_modules"
        unique_together = (('business_unit_id', 'module_code'),)

    def __str__(self):
        return f"{self.module_code} - {self.status}"
