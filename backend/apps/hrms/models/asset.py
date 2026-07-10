# yss_orbit/backend/apps/hrms/models/asset.py
from django.db import models
from apps.platform.models.base import TenantModel


class AssetCategory(TenantModel):
    """
    Category of company assets that can be assigned to employees.
    Examples: Laptop, Mobile Phone, SIM Card, Company Vehicle, ID Card, Access Card.
    """
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon        = models.CharField(max_length=50, blank=True)  # Lucide icon name
    is_active   = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_asset_categories'
        ordering = ['name']
        unique_together = [('business_unit_id', 'name')]

    def __str__(self) -> str:
        return self.name


class Asset(TenantModel):
    """
    A specific physical asset owned by the company.
    Tracks serial number, purchase details, current status, and assignment history.

    Lifecycle:
        AVAILABLE → [assign] → ASSIGNED → [return] → AVAILABLE
                            ↘ [damage] → DAMAGED → [repair] → AVAILABLE
                            ↘ [lost]   → LOST → [write-off] → WRITTEN_OFF
    """

    class Status(models.TextChoices):
        AVAILABLE   = 'AVAILABLE',   'Available'
        ASSIGNED    = 'ASSIGNED',    'Assigned'
        DAMAGED     = 'DAMAGED',     'Damaged'
        UNDER_REPAIR = 'UNDER_REPAIR', 'Under Repair'
        LOST        = 'LOST',        'Lost'
        WRITTEN_OFF = 'WRITTEN_OFF', 'Written Off'
        RETIRED     = 'RETIRED',     'Retired'

    class Condition(models.TextChoices):
        NEW         = 'NEW',       'New'
        GOOD        = 'GOOD',      'Good'
        FAIR        = 'FAIR',      'Fair'
        POOR        = 'POOR',      'Poor'
        DAMAGED     = 'DAMAGED',   'Damaged'

    category      = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    asset_tag     = models.CharField(max_length=50, db_index=True)  # Internal asset ID e.g. ASSET-001
    brand         = models.CharField(max_length=100, blank=True)
    model_name    = models.CharField(max_length=200, blank=True)
    serial_number = models.CharField(max_length=100, blank=True, db_index=True)
    description   = models.TextField(blank=True)

    purchase_date   = models.DateField(null=True, blank=True)
    purchase_price  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)

    status    = models.CharField(max_length=15, choices=Status.choices, default=Status.AVAILABLE, db_index=True)
    condition = models.CharField(max_length=10, choices=Condition.choices, default=Condition.NEW)

    notes = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_assets'
        unique_together = [('business_unit_id', 'asset_tag')]
        indexes = [
            models.Index(fields=['business_unit_id', 'status']),
            models.Index(fields=['business_unit_id', 'category_id']),
        ]

    def __str__(self) -> str:
        return f"{self.asset_tag} — {self.brand} {self.model_name} [{self.status}]"


class AssetAssignment(TenantModel):
    """
    Records assignment of an asset to an employee for a period.

    One asset can have multiple historical assignments.
    Only one assignment per asset should be ACTIVE at any time
    (enforced by AssetService, not at DB level to allow history queries).

    Condition on assignment vs. return is tracked for accountability.
    """

    class Status(models.TextChoices):
        ACTIVE    = 'ACTIVE',    'Active'
        RETURNED  = 'RETURNED',  'Returned'
        DAMAGED   = 'DAMAGED',   'Returned Damaged'
        LOST      = 'LOST',      'Reported Lost'

    asset       = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name='assignments')
    employee_id = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee

    assigned_on        = models.DateField()
    assigned_by_id     = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User (HR)
    condition_on_assign = models.CharField(max_length=10, choices=Asset.Condition.choices, default=Asset.Condition.GOOD)

    returned_on        = models.DateField(null=True, blank=True)
    received_by_id     = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User (HR)
    condition_on_return = models.CharField(max_length=10, choices=Asset.Condition.choices, blank=True)

    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    notes       = models.TextField(blank=True)
    acknowledgment_signed = models.BooleanField(default=False)  # Employee signed asset receipt

    class Meta(TenantModel.Meta):
        db_table = 'hrms_asset_assignments'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'status']),
            models.Index(fields=['business_unit_id', 'asset_id', 'status']),
        ]

    def __str__(self) -> str:
        return f"Asset {self.asset.asset_tag} → {self.employee_id} [{self.status}]"
