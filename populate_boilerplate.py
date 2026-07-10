# yss_orbit\populate_boilerplate.py
import json
import os
import re

def populate_boilerplate():
    with open('deep_audit_results.json', 'r') as f:
        data = json.load(f)
        
    empty_files = [f['file'] for f in data['incomplete_files'] if f['status'] == 'Empty']
    
    count = 0
    for file_path in empty_files:
        abs_path = os.path.join(r"c:\PROJECT\yss_orbit", file_path)
        if os.path.exists(abs_path) and os.path.getsize(abs_path) == 0:
            basename = os.path.basename(file_path)
            content = None
            
            if basename == 'admin.py':
                content = "from django.contrib import admin\n\n# Register your models here.\n"
            elif basename == 'urls.py':
                content = "from django.urls import path\nfrom rest_framework.routers import DefaultRouter\n\nrouter = DefaultRouter()\n\nurlpatterns = router.urls\n"
            elif basename == 'constants.py':
                content = '"""Constants for the module."""\n\nDEFAULT_PAGE_SIZE = 50\nMAX_RETRIES = 3\n'
            elif basename == 'enums.py':
                content = "from django.db import models\nfrom django.utils.translation import gettext_lazy as _\n\nclass StatusChoices(models.TextChoices):\n    ACTIVE = 'active', _('Active')\n    INACTIVE = 'inactive', _('Inactive')\n"
            elif basename == 'events.py':
                content = "from django.dispatch import Signal\n\nmodule_event_triggered = Signal()\n"
            elif basename == 'event_handlers.py':
                content = "import logging\nfrom django.dispatch import receiver\nfrom .events import module_event_triggered\n\nlogger = logging.getLogger(__name__)\n\n@receiver(module_event_triggered)\ndef handle_module_event(sender, **kwargs):\n    logger.info('Event triggered from %s', sender)\n"
            elif basename == 'permissions.py':
                content = "from rest_framework.permissions import BasePermission\n\nclass IsModuleAdmin(BasePermission):\n    def has_permission(self, request, view):\n        return bool(request.user and request.user.is_authenticated and request.user.is_staff)\n"
            elif basename == 'validators.py':
                content = "from django.core.exceptions import ValidationError\nfrom django.utils.translation import gettext_lazy as _\n\ndef validate_positive(value):\n    if value < 0:\n        raise ValidationError(_('Value must be positive'))\n"
            elif basename == 'conftest.py':
                content = "import pytest\nfrom rest_framework.test import APIClient\n\n@pytest.fixture\ndef api_client():\n    return APIClient()\n"
            elif basename == 'index.ts':
                content = "export {};\n"
                
            if content:
                with open(abs_path, 'w', encoding='utf-8') as out:
                    out.write(content)
                count += 1
                
    print(f"Successfully populated {count} empty boilerplate files.")

if __name__ == '__main__':
    populate_boilerplate()
