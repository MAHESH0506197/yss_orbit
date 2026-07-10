# yss_orbit\backend\apps\recruitment\validators\validators.py
from rest_framework.exceptions import ValidationError
from django.utils import timezone

class RecruitmentValidator:
    @staticmethod
    def validate_job_posting(data):
        if data.get("total_openings", 1) < 1:
            raise ValidationError("Total openings must be at least 1.")
        
        if data.get("application_deadline") and data["application_deadline"] < timezone.now().date():
            raise ValidationError("Application deadline cannot be in the past.")

    @staticmethod
    def validate_application(data):
        if not data.get("email") and not data.get("phone"):
            raise ValidationError("Either email or phone must be provided.")
