# yss_orbit\backend\core\base\tenant_model.py
import uuid
from django.db import models
from core.base.base_model import BaseModel

class TenantModel(BaseModel):
    business_unit_id = models.UUIDField(
        db_index=True,
        null=False,
        help_text="The business unit this record belongs to. NEVER cross-tenant.",
    )

    class Meta(BaseModel.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        from core.tenancy.tenant_context import get_current_tenant_id
        tenant_id = get_current_tenant_id()
        if tenant_id:
            if not self.business_unit_id:
                self.business_unit_id = tenant_id
            elif str(self.business_unit_id) != str(tenant_id):
                from core.exceptions import CrossTenantViolationException
                raise CrossTenantViolationException("Cross-tenant data access attempt blocked.")
        super().save(*args, **kwargs)

    def validate_business_unit(self, expected_bu_id: uuid.UUID) -> None:
        if str(self.business_unit_id) != str(expected_bu_id):
            # If there's an exception module in core/exceptions we should use it later.
            # For now, stick with a generic ValueError or keep the import from core.exceptions
            from core.exceptions import TenantViolationException
            raise TenantViolationException(
                details={
                    "record_business_unit_id": str(self.business_unit_id),
                    "expected_business_unit_id": str(expected_bu_id),
                }
            )
