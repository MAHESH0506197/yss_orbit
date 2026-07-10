# yss_orbit\backend\apps\recruitment\models\recruitment_model.py
from django.db import models
from apps.platform.models.base import TenantModel

class JobPosting(TenantModel):
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=[('OPEN', 'Open'), ('CLOSED', 'Closed')])
    department_id = models.UUIDField(null=True, blank=True)

class Applicant(TenantModel):
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    status = models.CharField(max_length=20, choices=[('APPLIED', 'Applied'), ('INTERVIEW', 'Interview'), ('OFFER', 'Offer'), ('REJECTED', 'Rejected')])

class Interview(TenantModel):
    applicant = models.ForeignKey(Applicant, on_delete=models.CASCADE)
    scheduled_at = models.DateTimeField()
    interviewer_id = models.UUIDField()
    feedback = models.TextField(blank=True)
    passed = models.BooleanField(default=False)