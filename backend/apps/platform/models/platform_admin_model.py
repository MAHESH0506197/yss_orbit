# yss_orbit\backend\apps\platform_admin\models\platform_admin_model.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PlatformAdminProfile(models.Model):
    """
    Profile extension for users who have super-admin (platform level) capabilities.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='platform_admin_profile')
    is_super_admin = models.BooleanField(default=False)
    security_clearance_level = models.IntegerField(default=1)

    class Meta:
        db_table = 'platform_admin_profiles'
