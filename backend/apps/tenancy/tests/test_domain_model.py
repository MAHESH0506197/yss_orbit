# yss_orbit\backend\apps\domain\tests\test_domain_model.py
from django.db import models

class GenericModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True
