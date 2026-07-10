# yss_orbit\fill_empty.py
﻿import os
from pathlib import Path

def generate_serializer_content(app_name, filename):
    model_name = filename.replace('_serializer.py', '').replace('_', ' ').title().replace(' ', '')
    if 'Response' in model_name:
        model_name = model_name.replace('Response', '')
    return f'''from rest_framework import serializers

class {model_name}Serializer(serializers.Serializer):
    """
    Serializer for {model_name}.
    """
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
'''

def generate_view_content(app_name, filename):
    model_name = filename.replace('_view.py', '').replace('_', ' ').title().replace(' ', '')
    return f'''from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class {model_name}APIView(APIView):
    """
    API View for {model_name}.
    """
    def get(self, request, *args, **kwargs):
        return Response({{"message": "{model_name} details retrieved"}}, status=status.HTTP_200_OK)
'''

def generate_service_content(app_name, filename):
    service_name = filename.replace('.py', '').replace('_', ' ').title().replace(' ', '')
    return f'''import logging

logger = logging.getLogger(__name__)

class {service_name}:
    """
    Service class handling business logic for {service_name}.
    """
    @classmethod
    def process(cls, *args, **kwargs):
        logger.info(f"Processing in {{cls.__name__}}")
        pass
'''

def process_files(app_path, app_name):
    for root, _, files in os.walk(app_path):
        for file in files:
            if not file.endswith('.py') or file == '__init__.py':
                continue
            
            filepath = os.path.join(root, file)
            if os.path.getsize(filepath) == 0:
                content = ""
                if 'serializers' in root:
                    content = generate_serializer_content(app_name, file)
                elif 'views' in root:
                    content = generate_view_content(app_name, file)
                elif 'services' in root or 'orchestrators' in root or 'repositories' in root or 'selectors' in root:
                    content = generate_service_content(app_name, file)
                elif 'models' in root:
                    # just a implemented model to not leave it empty
                    model_name = file.replace('_model.py', '').replace('_', ' ').title().replace(' ', '')
                    content = f'''from django.db import models\nfrom apps.core.models import TenantModel\n\nclass {model_name}(TenantModel):\n    name = models.CharField(max_length=255)\n\n    class Meta(TenantModel.Meta):\n        abstract = True\n'''
                elif 'tasks' in root or 'commands' in root:
                    content = '''import logging\n\nlogger = logging.getLogger(__name__)\n\ndef execute_task():\n    logger.info("Task executed successfully")\n'''
                elif file == 'apps.py':
                    content = f'''from django.apps import AppConfig\n\nclass {app_name.title().replace('_', '')}Config(AppConfig):\n    default_auto_field = 'django.db.models.BigAutoField'\n    name = 'apps.{app_name}'\n'''
                elif file == 'urls.py':
                    content = '''from django.urls import path\n\nurlpatterns = [\n    # add paths here\n]\n'''
                elif file == 'enums.py':
                    content = '''from django.db import models\n\nclass GenericStatus(models.TextChoices):\n    ACTIVE = 'ACTIVE', 'Active'\n    INACTIVE = 'INACTIVE', 'Inactive'\n'''
                elif file == 'permissions.py':
                    content = '''from rest_framework.permissions import BasePermission\n\nclass IsModuleAdmin(BasePermission):\n    def has_permission(self, request, view):\n        return request.user and request.user.is_staff\n'''
                else:
                    content = '''# Placeholder implementation\npass\n'''

                if content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

apps = ["hrms_core", "attendance"]
base_dir = r"c:\PROJECT\yss_orbit\backend\apps"
for app in apps:
    process_files(os.path.join(base_dir, app), app)
