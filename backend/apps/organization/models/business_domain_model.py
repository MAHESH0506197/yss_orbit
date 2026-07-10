from django.db import models
from apps.platform.models.base import BaseModel

class BusinessDomain(BaseModel):
    """
    Business Domain defines the operational ecosystem of a Tenant.
    It replaces the hardcoded 'industry' label and provides a foundation 
    for domain-specific workflows and module templates.
    """
    name = models.CharField(max_length=100, help_text="e.g. Retail, Pharmacy, HRMS")
    code = models.CharField(max_length=20, help_text="e.g. BDOM-RTL")
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    
    # Custom restore audit logs
    restored_at = models.DateTimeField(null=True, blank=True)
    restored_by_id = models.UUIDField(null=True, blank=True)
    restored_reason = models.TextField(blank=True, default="")

    class Meta(BaseModel.Meta):
        db_table = "business_domains"
        ordering = ["name"]
        verbose_name = "Business Domain"
        verbose_name_plural = "Business Domains"
        # ISSUE-10: Added indexes for the most common SoftDeleteManager filter patterns.
        # (is_deleted, is_active) covers the primary queryset filter on every list endpoint.
        indexes = [
            models.Index(fields=["is_deleted", "is_active"], name="bd_status_idx"),
            models.Index(fields=["code"],                    name="bd_code_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(is_deleted=False),
                name="unique_active_business_domain_name",
            ),
            models.UniqueConstraint(
                fields=["code"],
                condition=models.Q(is_deleted=False),
                name="unique_active_business_domain_code",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"
