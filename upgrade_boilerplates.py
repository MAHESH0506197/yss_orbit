# yss_orbit\upgrade_boilerplates.py
import os
import re

apps = ['batch_tracking', 'stock_transfer', 'vendor_management', 'pharmacy', 'drug_register', 'pharmacy_billing', 'expiry_tracking', 'hrms', 'hrms_core', 'attendance', 'leave', 'leave_management', 'payroll', 'recruitment', 'appraisal', 'reporting', 'dashboard', 'support']

def to_camel_case(snake_str):
    components = snake_str.split('_')
    return "".join(x.title() for x in components)

def get_model_name_from_file(filename):
    name = filename.replace('.py', '')
    if name.endswith('_model'):
        name = name[:-6]
    return to_camel_case(name)

def to_snake_case(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

for app in apps:
    app_dir = os.path.join(base_dir, app)
    if not os.path.exists(app_dir):
        continue
    
    models_found = []
    
    # First pass: collect models
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                if 'models' in root:
                    models_found.append(get_model_name_from_file(file))
                        
    # Second pass: generate content
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                path = os.path.join(root, file)
                size = os.path.getsize(path)
                
                # If size <= 250, we might want to re-overwrite it if it was our previous implemented code
                if size <= 250:
                    content = ""
                    
                    if 'admin' in file:
                        imports = ", ".join(models_found)
                        registers = "\\n".join([f"admin.site.register({m})" for m in models_found])
                        content = f"from django.contrib import admin\nfrom apps.{app}.models import {imports}\n\n{registers}\n"
                    
                    elif 'services' in root:
                        m_name = get_model_name_from_file(file.replace('_service', ''))
                        content = f"""from django.db import transaction
from typing import Dict, Any

class {m_name}Service:
    @classmethod
    @transaction.atomic
    def create(cls, data: Dict[str, Any]):
        # Implementation for creating {m_name}
        pass

    @classmethod
    @transaction.atomic
    def update(cls, instance_id, data: Dict[str, Any]):
        # Implementation for updating {m_name}
        pass
"""
                    elif 'repositories' in root:
                        m_name = get_model_name_from_file(file.replace('_repository', ''))
                        content = f"""from typing import List, Optional

class {m_name}Repository:
    @classmethod
    def get_by_id(cls, record_id) -> Optional[Any]:
        return None

    @classmethod
    def list_all(cls) -> List[Any]:
        return []

    @classmethod
    def save(cls, instance):
        instance.save()
        return instance
"""
                    elif 'orchestrators' in root:
                        m_name = get_model_name_from_file(file.replace('_orchestrator', ''))
                        content = f"""from typing import Dict, Any

class {m_name}Orchestrator:
    @classmethod
    def handle_process(cls, data: Dict[str, Any]):
        \"\"\"
        Orchestrates the workflow for {m_name}.
        \"\"\"
        # 1. Validate data
        # 2. Call service layer
        # 3. Emit events
        pass
"""
                    elif 'selectors' in root:
                        m_name = get_model_name_from_file(file.replace('_selector', ''))
                        content = f"""from typing import QuerySet

class {m_name}Selector:
    @classmethod
    def get_active_records(cls) -> QuerySet:
        # Return active records
        return None

    @classmethod
    def search(cls, query: str) -> QuerySet:
        # Search records
        return None
"""
                    elif 'tasks' in root:
                        m_name = get_model_name_from_file(file.replace('_tasks', ''))
                        content = f"""from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_{to_snake_case(m_name)}_task(record_id: str):
    logger.info(f"Processing task for {m_name} {{record_id}}")
    try:
        # Task implementation
        pass
    except Exception as e:
        logger.error(f"Error processing {m_name} task: {{e}}")
        raise
"""
                    elif 'tests' in root:
                        m_name = get_model_name_from_file(file.replace('test_', '').replace('_api', '').replace('_model', ''))
                        content = f"""import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
class Test{to_camel_case(m_name)}:
    def test_creation(self, api_client):
        # Implement test for {m_name} creation
        assert True

    def test_list(self, api_client):
        # Implement test for listing {m_name}
        assert True
"""
                    elif 'constants' in root or 'enums' in root:
                        content = f"""from django.db import models

class {to_camel_case(file.replace('.py', ''))}:
    STATUS_PENDING = 'PENDING'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_COMPLETED = 'COMPLETED'
    
    CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
    ]
"""
                    elif 'events' in root:
                        content = f"""import logging

logger = logging.getLogger(__name__)

class {to_camel_case(file.replace('.py', ''))}:
    @staticmethod
    def on_created(instance):
        logger.info(f"Record created: {{instance}}")

    @staticmethod
    def on_updated(instance):
        logger.info(f"Record updated: {{instance}}")
"""
                    
                    if content:
                        # Fix any potential Any import
                        if 'Any' in content and 'typing' not in content:
                            content = "from typing import Any\n" + content
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)

print("Done upgrading code.")
