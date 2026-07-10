# yss_orbit\backend\apps\health\tests\test_health_model.py
from django.db import models

class GenericModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True
