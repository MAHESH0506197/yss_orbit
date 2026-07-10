from django.db import models
from apps.platform.models.base import TenantModel

class AttendancePunch(TenantModel):
    class Source(models.TextChoices):
        WEB = 'WEB', 'Web'
        MOBILE = 'MOBILE', 'Mobile'
        BIOMETRIC = 'BIOMETRIC', 'Biometric'
        IMPORT = 'IMPORT', 'Import'
        ADMIN = 'ADMIN', 'Admin'
        
    class PunchType(models.TextChoices):
        IN = 'IN', 'In'
        OUT = 'OUT', 'Out'

    record = models.ForeignKey('hrms.AttendanceRecord', on_delete=models.CASCADE, related_name='punches')
    punch_time = models.DateTimeField()
    punch_type = models.CharField(max_length=4, choices=PunchType.choices)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.WEB)
    
    # Audit tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.record.employee.employee_code} - {self.punch_type} @ {self.punch_time.strftime('%H:%M:%S')}"
