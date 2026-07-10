# yss_orbit\backend\apps\domain\models\domain_module_map_model.py
from django.db import models
from apps.platform.models.base import TenantModel
from .domain_model import Domain

class DomainModuleMap(TenantModel):
    """
    Maps a specific domain to a specific platform module.
    (e.g., pos.yssorbit.com -> POS Module)
    """
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='module_maps')
    module_name = models.CharField(max_length=100, help_text="The internal module identifier (e.g., 'pos', 'hrms')")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'domain_module_maps'
        verbose_name = 'Domain Module Map'
        verbose_name_plural = 'Domain Module Maps'
        unique_together = ('domain', 'module_name')
        
    def __str__(self):
        return f"{self.domain.name} -> {self.module_name}"
