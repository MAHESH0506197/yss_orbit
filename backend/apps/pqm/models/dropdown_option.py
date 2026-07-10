from django.db import models
from apps.platform.models.base import TenantModel

class DropdownFieldType(models.TextChoices):
    PRIORITY = "PRIORITY", "Priority"
    SEVERITY = "SEVERITY", "Severity"
    REFERENCE_TYPE = "REFERENCE_TYPE", "Reference Type"
    AREA = "AREA", "Area of NC Raised"
    CATEGORY = "CATEGORY", "Category"
    SUB_CATEGORY = "SUB_CATEGORY", "Sub-category"

class PQMDropdownOption(TenantModel):
    organization_id = models.UUIDField(db_index=True)
    field_type = models.CharField(max_length=30, choices=DropdownFieldType.choices)
    name = models.CharField(max_length=100)
    system_mapping = models.CharField(
        max_length=50, 
        blank=True, 
        default="", 
        help_text="Used to map custom options to system logic (e.g. mapping to 'Critical' for dashboard KPIs)"
    )
    display_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "pqm_dropdown_option"
        unique_together = [('business_unit_id', 'field_type', 'name')]
        ordering = ['field_type', 'display_order', 'name']

    def __str__(self):
        return f"{self.field_type} - {self.name}"
