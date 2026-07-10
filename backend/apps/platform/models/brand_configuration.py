# yss_orbit\backend\apps\branding\models\brand_configuration.py
import uuid
from django.db import models
from apps.platform.models import BaseModel
from apps.organization.models.organization_model import Organization

class BrandConfiguration(BaseModel):
    """
    Stores branding configuration.
    Owned at Organization level.
    Can be overridden at BusinessUnit level (if business_unit_id is not null).
    """

    class BrandingMode(models.TextChoices):
        PLATFORM = "platform", "Platform"
        CO_BRAND = "co_brand", "Co-Brand"
        WHITE_LABEL = "white_label", "White Label"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="brand_configurations",
        db_index=True,
    )
    business_unit = models.ForeignKey(
        "organization.BusinessUnit",
        on_delete=models.CASCADE,
        related_name="brand_configurations",
        null=True,
        blank=True,
        db_index=True,
    )

    branding_mode = models.CharField(
        max_length=20,
        choices=BrandingMode.choices,
        default=BrandingMode.PLATFORM,
    )
    logo_url = models.URLField(max_length=1000, blank=True, null=True)
    custom_domain = models.CharField(max_length=255, blank=True, unique=True, null=True)

    class DomainStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        FAILED = "failed", "Failed"

    class SSLStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROVISIONING = "provisioning", "Provisioning"
        ACTIVE = "active", "Active"
        FAILED = "failed", "Failed"

    domain_status = models.CharField(max_length=20, choices=DomainStatus.choices, default=DomainStatus.PENDING)
    ssl_status = models.CharField(max_length=20, choices=SSLStatus.choices, default=SSLStatus.PENDING)

    class Meta(BaseModel.Meta):
        db_table = "brand_configurations"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "business_unit"],
                name="unique_brand_config_per_org_and_bu",
                condition=models.Q(is_deleted=False),
            )
        ]
