from django.db import models
from apps.platform.models.base import TenantModel

class HolidayCalendar(TenantModel):
    name = models.CharField(max_length=100)
    year = models.IntegerField()
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.year})"

class Holiday(TenantModel):
    calendar = models.ForeignKey(HolidayCalendar, on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=100)
    date = models.DateField()
    is_optional = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.date}"
