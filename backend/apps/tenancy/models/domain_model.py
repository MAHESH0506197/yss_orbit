# yss_orbit\backend\apps\domain\models\domain_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class Domain(TenantModel):
    """
    Represents a custom domain assigned to a tenant or business unit.
    """
    name = models.CharField(max_length=255, unique=True, help_text="The Fully Qualified Domain Name (FQDN)")
    is_primary = models.BooleanField(default=False, help_text="Is this the primary domain for the tenant?")
    is_verified = models.BooleanField(default=False, help_text="Has the domain ownership been verified via DNS?")
    ssl_enabled = models.BooleanField(default=False, help_text="Is SSL provisioning active for this domain?")
    ssl_status = models.CharField(max_length=50, blank=True, null=True, help_text="Status of the SSL certificate issuance")
    
    class Meta:
        db_table = 'domain_domains'
        verbose_name = 'Domain'
        verbose_name_plural = 'Domains'
        
    def __str__(self):
        return self.name


