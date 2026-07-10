# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\constants\constants.py
from django.db import models

class Constants:
    STATUS_PENDING = 'PENDING'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_COMPLETED = 'COMPLETED'
    
    CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
    ]
