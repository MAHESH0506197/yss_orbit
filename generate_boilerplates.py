# yss_orbit\generate_boilerplates.py
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

def generate_model_code(app, model_name):
    lower_name = model_name.lower()
    
    fields = """    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)"""
    
    if 'leave' in lower_name:
        fields = """    employee_id = models.UUIDField()
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=50, default='PENDING')"""
    elif 'attendance' in lower_name:
        fields = """    employee_id = models.UUIDField()
    date = models.DateField()
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default='PRESENT')"""
    elif 'appraisal' in lower_name or 'feedback' in lower_name or 'review' in lower_name:
        fields = """    employee_id = models.UUIDField()
    reviewer_id = models.UUIDField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True, null=True)"""
    elif 'payroll' in lower_name or 'salary' in lower_name:
        fields = """    employee_id = models.UUIDField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    pay_period_start = models.DateField()
    pay_period_end = models.DateField()
    status = models.CharField(max_length=50, default='DRAFT')"""
    elif 'recruit' in lower_name or 'candidate' in lower_name or 'interview' in lower_name:
        fields = """    candidate_name = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    resume_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=50, default='APPLIED')"""
    elif 'batch' in lower_name:
        fields = """    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField()
    expiry_date = models.DateField()
    quantity = models.IntegerField(default=0)"""
    elif 'stock' in lower_name or 'transfer' in lower_name:
        fields = """    source_location_id = models.UUIDField()
    destination_location_id = models.UUIDField()
    item_id = models.UUIDField()
    quantity = models.IntegerField()
    status = models.CharField(max_length=50, default='PENDING')"""
    elif 'vendor' in lower_name:
        fields = """    vendor_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)"""
    elif 'pharmacy' in lower_name or 'drug' in lower_name or 'medication' in lower_name:
        fields = """    drug_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)"""
    elif 'report' in lower_name:
        fields = """    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=100)
    generated_by = models.UUIDField()
    file_url = models.URLField(blank=True, null=True)"""
    elif 'dashboard' in lower_name or 'widget' in lower_name:
        fields = """    title = models.CharField(max_length=255)
    widget_type = models.CharField(max_length=100)
    configuration = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)"""

    return f"""from django.db import models
from apps.core.models import TenantModel

class {model_name}(TenantModel):
{fields}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = '{app}_{to_snake_case(model_name)}'
        verbose_name = '{model_name}'
        verbose_name_plural = '{model_name}s'

    def __str__(self):
        return str(self.id)
"""

def generate_serializer_code(app, model_name):
    return f"""from rest_framework import serializers
from apps.{app}.models.{to_snake_case(model_name)} import {model_name}

class {model_name}Serializer(serializers.ModelSerializer):
    class Meta:
        model = {model_name}
        fields = '__all__'
"""

def generate_response_serializer_code(app, model_name):
    return f"""from rest_framework import serializers

class {model_name}ResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    message = serializers.CharField()
"""

def generate_view_code(app, model_name):
    return f"""from rest_framework import viewsets, permissions
from apps.{app}.models.{to_snake_case(model_name)} import {model_name}
from apps.{app}.api.serializers.{to_snake_case(model_name)}_serializer import {model_name}Serializer

class {model_name}ViewSet(viewsets.ModelViewSet):
    queryset = {model_name}.objects.all()
    serializer_class = {model_name}Serializer
    permission_classes = [permissions.IsAuthenticated]
"""

def generate_urls_code(app, model_names):
    imports = []
    registers = []
    for m in model_names:
        imports.append(f"from apps.{app}.api.views.{to_snake_case(m)}_view import {m}ViewSet")
        registers.append(f"router.register(r'{to_snake_case(m)}s', {m}ViewSet, basename='{to_snake_case(m)}')")
    
    imports_str = "\\n".join(imports)
    registers_str = "\\n".join(registers)
    
    return f"""from django.urls import path, include
from rest_framework.routers import DefaultRouter
{imports_str}

router = DefaultRouter()
{registers_str}

urlpatterns = [
    path('', include(router.urls)),
]
"""

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
                path = os.path.join(root, file)
                size = os.path.getsize(path)
                if size <= 150:
                    if 'models' in root:
                        models_found.append(get_model_name_from_file(file))
                        
    # Second pass: generate content
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                path = os.path.join(root, file)
                size = os.path.getsize(path)
                if size <= 150:
                    content = ""
                    if 'models' in root:
                        m_name = get_model_name_from_file(file)
                        content = generate_model_code(app, m_name)
                    elif 'serializers' in root:
                        m_name = get_model_name_from_file(file.replace('_serializer', '').replace('_response', ''))
                        if 'response' in file:
                            content = generate_response_serializer_code(app, m_name)
                        else:
                            content = generate_serializer_code(app, m_name)
                    elif 'views' in root:
                        m_name = get_model_name_from_file(file.replace('_view', '').replace('_detail', '').replace('_list', ''))
                        content = generate_view_code(app, m_name)
                    elif file == 'admin.py':
                        content = f"from django.contrib import admin\n# Register your models here.\n"
                    elif file == 'urls.py':
                        content = generate_urls_code(app, models_found)
                    elif 'constants' in root or 'enums' in root:
                        content = "class Constants:\n    pass\n"
                    elif 'events' in root:
                        content = "class Events:\n    pass\n"
                    elif 'services' in root:
                        m_name = get_model_name_from_file(file.replace('_service', ''))
                        content = f"class {m_name}Service:\n    @classmethod\n    def process(cls):\n        pass\n"
                    elif 'repositories' in root:
                        m_name = get_model_name_from_file(file.replace('_repository', ''))
                        content = f"class {m_name}Repository:\n    @classmethod\n    def get_all(cls):\n        return []\n"
                    elif 'orchestrators' in root:
                        m_name = get_model_name_from_file(file.replace('_orchestrator', ''))
                        content = f"class {m_name}Orchestrator:\n    @classmethod\n    def orchestrate(cls):\n        pass\n"
                    elif 'selectors' in root:
                        m_name = get_model_name_from_file(file.replace('_selector', ''))
                        content = f"class {m_name}Selector:\n    @classmethod\n    def select(cls):\n        return None\n"
                    elif 'tasks' in root:
                        m_name = get_model_name_from_file(file.replace('_tasks', ''))
                        content = f"from celery import shared_task\n\n@shared_task\ndef {to_snake_case(m_name)}_task():\n    pass\n"
                    elif 'tests' in root:
                        content = "import pytest\n\n@pytest.mark.django_db\nclass TestSuite:\n    def test_basic(self):\n        assert True\n"
                    else:
                        content = f"
                    
                    if content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)

print("Done generating code.")
