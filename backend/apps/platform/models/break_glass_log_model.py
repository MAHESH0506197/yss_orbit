# yss_orbit\backend\apps\platform_admin\models\break_glass_log_model.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class BreakGlassLog(models.Model):
    """
    Audit log of when a super admin bypassed multi-tenant boundaries.
    """
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='break_glass_logs')
    target_tenant_id = models.IntegerField(help_text="The Organization ID they accessed")
    reason = models.TextField(help_text="Mandatory incident reason/ticket URL")
    accessed_at = models.DateTimeField(auto_now_add=True)
    duration_minutes = models.IntegerField(default=60)
    
    class Meta:
        db_table = 'platform_admin_break_glass_logs'
        ordering = ['-accessed_at']

    def __str__(self):
        return f"{self.admin_user.email} -> Tenant {self.target_tenant_id} at {self.accessed_at}"
