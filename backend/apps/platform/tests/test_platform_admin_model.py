# yss_orbit\backend\apps\platform_admin\tests\test_platform_admin_model.py
from django.db import models

class GenericModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True
