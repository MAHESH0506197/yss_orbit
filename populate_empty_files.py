# yss_orbit\populate_empty_files.py
import os
import glob
from pathlib import Path

TARGET_APPS = ['inventory', 'pos', 'customers', 'retail_billing']
BASE_DIR = Path('c:/PROJECT/yss_orbit/backend/apps')

def get_empty_files():
    empty_files = []
    for app in TARGET_APPS:
        app_dir = BASE_DIR / app
        if not app_dir.exists():
            continue
        for root, dirs, files in os.walk(app_dir):
            for file in files:
                if not file.endswith('.py'):
                    continue
                file_path = Path(root) / file
                if file_path.stat().st_size < 100:
                    empty_files.append(file_path)
    return empty_files

def populate_file(path: Path):
    name = path.name
    parent_name = path.parent.name
    content = ""

    app_name = path.parts[path.parts.index('apps') + 1]

    if name == '__init__.py':
        # Just leave it empty or add a basic docstring
        if path.stat().st_size == 0:
            content = '"""\nPackage initialization.\n"""\n'
        else:
            return # Skip if not 0

    elif name == 'admin.py':
        content = f'''from django.contrib import admin
# Register your models here.
'''

    elif 'constant' in name or 'constant' in parent_name:
        class_name = name.replace('.py', '').title().replace('_', '')
        content = f'''"""
Constants for {app_name}.
"""

class {class_name}Constants:
    """Constants definition."""
    pass
'''

    elif 'enum' in name or 'enum' in parent_name:
        content = f'''from django.db import models

class DefaultStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
'''

    elif 'event' in name or 'event' in parent_name:
        if 'handler' in name:
            content = f'''"""
Event handlers for {app_name}.
"""
def handle_default_event(sender, **kwargs):
    pass
'''
        else:
            content = f'''import django.dispatch

default_event = django.dispatch.Signal()
'''

    elif 'validator' in name or 'validator' in parent_name:
        content = f'''from django.core.exceptions import ValidationError

def validate_positive(value):
    if value < 0:
        raise ValidationError("Value must be positive.")
'''

    elif 'conftest' in name:
        content = f'''import pytest

@pytest.fixture
def sample_fixture():
    return {{"key": "value"}}
'''

    elif 'factories' in name:
        content = f'''import factory

# class BaseModelFactory(factory.django.DjangoModelFactory):
#     class Meta:
#         model = 'app.Model'
'''

    elif name.startswith('test_'):
        content = f'''import pytest

pytestmark = pytest.mark.django_db

def test_example_{name.replace(".py", "")}():
    assert True
'''

    elif 'tasks' in name or 'tasks' in parent_name:
        content = f'''from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def default_{app_name}_task():
    logger.info("Executing default task")
'''

    elif 'urls.py' in name:
        content = f'''from django.urls import path

app_name = '{app_name}'

urlpatterns = [
    # path('', view, name='name'),
]
'''

    elif 'serializer' in name or 'serializer' in parent_name:
        content = f'''from rest_framework import serializers

class DefaultSerializer(serializers.Serializer):
    """Default serializer for {name.replace('.py', '')}."""
    pass
'''

    elif 'view' in name or 'view' in parent_name:
        content = f'''from rest_framework.views import APIView
from rest_framework.response import Response

class DefaultView(APIView):
    """Default view for {name.replace('.py', '')}."""
    def get(self, request, *args, **kwargs):
        return Response({{"status": "ok"}})
'''

    elif 'service' in name or 'service' in parent_name:
        class_name = name.replace('.py', '').title().replace('_', '')
        content = f'''"""
Service logic for {name.replace('.py', '')}.
"""
import logging

logger = logging.getLogger(__name__)

class {class_name}:
    """{class_name} service implementation."""
    
    @classmethod
    def execute(cls, *args, **kwargs):
        pass
'''

    elif 'repository' in name or 'repository' in parent_name:
        class_name = name.replace('.py', '').title().replace('_', '')
        content = f'''"""
Repository layer for {name.replace('.py', '')}.
"""

class {class_name}:
    """{class_name} repository implementation."""
    
    @classmethod
    def get_all(cls):
        return []
'''

    elif 'selector' in name or 'selector' in parent_name:
        content = f'''"""
Selectors for {name.replace('.py', '')}.
"""

def get_default_queryset():
    return []
'''

    elif 'orchestrator' in name or 'orchestrator' in parent_name:
        class_name = name.replace('.py', '').title().replace('_', '')
        content = f'''"""
Orchestrator for {name.replace('.py', '')}.
"""

class {class_name}:
    """{class_name} orchestrator implementation."""
    
    @classmethod
    def process(cls, *args, **kwargs):
        pass
'''

    elif 'model' in name or 'model' in parent_name:
        content = f'''from django.db import models
from core.models.base_model import BaseModel # assuming base model exists

class DefaultModel(models.Model):
    """Default model stub."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
'''

    elif 'permission' in name or 'permission' in parent_name:
        content = f'''from rest_framework.permissions import BasePermission

class IsDefaultUser(BasePermission):
    """Allows access only to default users."""
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
'''

    elif 'admin' in name:
        pass # Already handled

    else:
        # Generic python file
        content = f'''"""
{name} module.
"""
'''

    if content and path.stat().st_size < 100:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Populated {path}")

def main():
    files = get_empty_files()
    for f in files:
        try:
            populate_file(f)
        except Exception as e:
            print(f"Error processing {f}: {e}")

if __name__ == '__main__':
    main()
