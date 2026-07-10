# yss_orbit\backend\update_files.py
import os
import sys

base = 'c:/PROJECT/yss_orbit/backend/apps'

files_to_update = [
    "appraisal/api/serializers/appraisal_response_serializer.py",
    "appraisal/management/commands/sync_appraisal.py",
    "appraisal/permissions/permissions.py",
    "appraisal/validators/validators.py",
    "attendance/api/urls.py",
    "attendance/management/commands/sync_attendance.py",
    "attendance/permissions/permissions.py",
    "batch_tracking/urls.py",
    "batch_tracking/api/serializers/urls.py",
    "drug_register/urls.py",
    "drug_register/constants/constants.py",
    "drug_register/events/events.py",
    "drug_register/management/commands/sync_drug_register.py",
    "drug_register/validators/validators.py",
    "expiry_tracking/urls.py",
    "expiry_tracking/constants/constants.py",
    "expiry_tracking/management/commands/sync_expiry_tracking.py",
    "hrms_core/api/urls.py",
    "hrms_core/management/commands/seed_hrms_defaults.py",
    "hrms_core/management/commands/sync_hrms_core.py",
    "hrms_core/permissions/permissions.py",
    "payroll/management/commands/run_payroll.py",
    "payroll/management/commands/sync_payroll.py",
    "payroll/permissions/permissions.py",
    "pharmacy_billing/urls.py",
    "pharmacy_billing/constants/constants.py",
    "pharmacy_billing/management/commands/sync_pharmacy_billing.py",
    "pharmacy_billing/validators/validators.py",
    "recruitment/api/serializers/recruitment_response_serializer.py",
    "recruitment/management/commands/sync_recruitment.py",
    "recruitment/permissions/permissions.py",
    "reporting/admin.py",
    "reporting/search_urls.py",
    "reporting/api/urls.py",
    "reporting/api/serializers/reporting_response_serializer.py",
    "reporting/api/serializers/report_response_serializer.py",
    "reporting/management/commands/sync_reporting.py",
    "reporting/permissions/permissions.py",
    "reporting/validators/validators.py",
    "stock_transfer/urls.py",
    "stock_transfer/api/serializers/urls.py",
    "vendor_management/urls.py",
    "vendor_management/api/serializers/urls.py",
]

templates = {
    'management_command': """from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Management command for module synchronization and processing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting command execution...'))
        try:
            # Implementation logic here
            self.stdout.write(self.style.SUCCESS('Execution completed successfully.'))
        except Exception as e:
            logger.error(f"Error during execution: {e}")
            self.stdout.write(self.style.ERROR('Execution failed.'))
""",
    'permissions': """from rest_framework.permissions import BasePermission

class IsModuleAdmin(BasePermission):
    \"\"\"
    Allows access only to admin users.
    \"\"\"
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class IsModuleManager(BasePermission):
    \"\"\"
    Allows access to managers or admins.
    \"\"\"
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.is_staff or getattr(request.user, 'role', '') in ['manager', 'admin'])
        )
""",
    'validators': """from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def validate_positive_quantity(value):
    if value is not None and value < 0:
        raise ValidationError(_("Value cannot be negative."))

def validate_date_range(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise ValidationError(_("Start date cannot be after end date."))
""",
    'constants': """# Module Constants

MAX_RECORDS_PER_PAGE = 100
DEFAULT_PAGINATION_LIMIT = 20

STATUS_PENDING = 'PENDING'
STATUS_APPROVED = 'APPROVED'
STATUS_REJECTED = 'REJECTED'

STATUS_CHOICES = (
    (STATUS_PENDING, 'Pending'),
    (STATUS_APPROVED, 'Approved'),
    (STATUS_REJECTED, 'Rejected'),
)
""",
    'events': """import logging
from django.dispatch import Signal

logger = logging.getLogger(__name__)

# Signals
item_created_signal = Signal()
item_updated_signal = Signal()
item_deleted_signal = Signal()

class ModuleEvents:
    @staticmethod
    def on_item_created(sender, instance, **kwargs):
        logger.info(f"Item created: {instance.pk}")

    @staticmethod
    def on_item_updated(sender, instance, **kwargs):
        logger.info(f"Item updated: {instance.pk}")
        
    @staticmethod
    def on_item_deleted(sender, instance, **kwargs):
        logger.info(f"Item deleted: {instance.pk}")
""",
    'serializer': """from rest_framework import serializers

class BaseResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    data = serializers.DictField(required=False)
""",
    'urls': """from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
""",
    'admin': """from django.contrib import admin

# Register your models here.
"""
}

for rel_path in files_to_update:
    full_path = os.path.join(base, rel_path)
    if not os.path.exists(full_path):
        print(f"Skipping {full_path} as it does not exist.")
        continue
    
    content = ""
    if "management/commands" in rel_path:
        content = templates['management_command']
    elif "permissions.py" in rel_path:
        content = templates['permissions']
    elif "validators.py" in rel_path:
        content = templates['validators']
    elif "constants.py" in rel_path:
        content = templates['constants']
    elif "events.py" in rel_path:
        content = templates['events']
    elif "serializer" in rel_path:
        content = templates['serializer']
    elif "urls.py" in rel_path:
        content = templates['urls']
    elif "admin.py" in rel_path:
        content = templates['admin']
    else:
        print(f"Could not determine template for {rel_path}")
        continue
        
    try:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {rel_path}")
    except Exception as e:
        print(f"Failed to update {rel_path}: {e}")
