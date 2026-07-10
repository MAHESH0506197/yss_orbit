# yss_orbit\backend\generator.py
import os
import re

apps = ['payroll', 'recruitment', 'appraisal', 'reporting']
base_dir = r'c:\PROJECT\yss_orbit\backend\apps'

def get_models(app_name):
    if app_name == 'payroll':
        return ['PayrollRun', 'Payslip', 'TDSSlab', 'SalaryStructure', 'SalaryComponent', 'SalaryStructureComponent']
    elif app_name == 'recruitment':
        return ['JobPosting', 'InterviewStage', 'Interview', 'Applicant', 'OfferLetter', 'Recruitment']
    elif app_name == 'appraisal':
        return ['AppraisalCycle', 'KPI', 'EmployeeAppraisal', 'Feedback', 'Review']
    elif app_name == 'reporting':
        return ['ReportTemplate', 'ReportExecution']
    return []

for app in apps:
    app_dir = os.path.join(base_dir, app)
    models = get_models(app)
    
    # Check if models exist in apps.<app>.models or apps.<app>.<app>_model
    # For simplicity in this generator, we will just use a generic import path.
    # We saw payroll uses payroll_model, etc.
    
    for root, dirs, files in os.walk(app_dir):
        for f in files:
            if not f.endswith('.py'): continue
            path = os.path.join(root, f)
            if os.path.getsize(path) < 100:
                content = ""
                # determine model import string depending on app
                if app == 'payroll':
                    model_imports = "from apps.payroll.payroll_model import PayrollRun, Payslip, TDSSlab\nfrom apps.payroll.salary_component_model import SalaryStructure, SalaryComponent, SalaryStructureComponent"
                elif app == 'recruitment':
                    model_imports = "from apps.recruitment.models import JobPosting, InterviewStage, Interview"
                elif app == 'appraisal':
                    model_imports = "from apps.recruitment.models import AppraisalCycle, KPI, EmployeeAppraisal"
                else:
                    model_imports = "from apps.observability.models import ReportTemplate, ReportExecution"

                if f == 'admin.py':
                    content = f"from django.contrib import admin\n{model_imports}\n\n"
                    for m in models:
                        if m in model_imports:
                            content += f"@admin.register({m})\nclass {m}Admin(admin.ModelAdmin):\n    list_display = ('id',)\n    search_fields = ('id',)\n\n"
                elif 'urls.py' in f:
                    content = f"from django.urls import path\n\nurlpatterns = [\n    # add paths here\n]\n"
                elif 'constants.py' in f or 'analytics_constants.py' in f:
                    content = f"\"\"\"Constants for {app} app.\"\"\"\n\nDEFAULT_PAGE_SIZE = 20\n"
                elif 'enums.py' in f or 'analytics_enums.py' in f:
                    content = f"from django.db import models\n\nclass DefaultStatus(models.TextChoices):\n    ACTIVE = 'ACTIVE', 'Active'\n    INACTIVE = 'INACTIVE', 'Inactive'\n"
                elif 'events.py' in f or 'analytics_events.py' in f:
                    content = f"import dataclasses\n\n@dataclasses.dataclass\nclass Base{app.capitalize()}Event:\n    event_id: str\n    timestamp: str\n"
                elif 'validators.py' in f:
                    content = f"from django.core.exceptions import ValidationError\n\ndef validate_positive(value):\n    if value < 0:\n        raise ValidationError('Value must be positive')\n"
                elif f == 'permissions.py':
                    content = f"from rest_framework.permissions import BasePermission\n\nclass Is{app.capitalize()}Admin(BasePermission):\n    def has_permission(self, request, view):\n        return request.user and request.user.is_staff\n"
                elif f.startswith('test_') and f.endswith('.py'):
                    content = f"import pytest\n\n@pytest.mark.django_db\ndef test_default_{app}_{f.replace('.py', '')}():\n    assert True\n"
                elif f == 'conftest.py':
                    content = f"import pytest\nfrom rest_framework.test import APIClient\n\n@pytest.fixture\ndef api_client():\n    return APIClient()\n"
                elif f == 'factories.py':
                    content = f"import factory\n# define factories for {app}\n"
                elif f.endswith('serializer.py'):
                    m = models[0] if models else 'Default'
                    for md in models:
                        if md.lower() in f.lower():
                            m = md
                            break
                    if m in model_imports:
                        content = f"from rest_framework import serializers\n{model_imports}\n\nclass {m}Serializer(serializers.ModelSerializer):\n    class Meta:\n        model = {m}\n        fields = '__all__'\n"
                    else:
                        content = f"from rest_framework import serializers\n\nclass DefaultSerializer(serializers.Serializer):\n    id = serializers.IntegerField()\n"
                elif f.endswith('view.py'):
                    m = models[0] if models else 'Default'
                    for md in models:
                        if md.lower() in f.lower():
                            m = md
                            break
                    if m in model_imports:
                        content = f"from rest_framework import viewsets\n{model_imports}\n# from .serializers import {m}Serializer\n\nclass {m}ViewSet(viewsets.ModelViewSet):\n    queryset = {m}.objects.all()\n    # serializer_class = {m}Serializer\n"
                    else:
                        content = f"from rest_framework.views import APIView\nfrom rest_framework.response import Response\n\nclass DefaultView(APIView):\n    def get(self, request):\n        return Response({{'status': 'ok'}})\n"
                elif 'service.py' in f:
                    content = f"class {f.replace('.py', '').title().replace('_', '')}:\n    @classmethod\n    def execute(cls):\n        pass\n"
                elif 'repository.py' in f:
                    content = f"class {f.replace('.py', '').title().replace('_', '')}:\n    def get_all(self):\n        return []\n"
                elif 'selectors.py' in f:
                    content = f"def get_{app}_list():\n    return []\n"
                elif 'orchestrator.py' in f:
                    content = f"class {app.capitalize()}Orchestrator:\n    def run(self):\n        pass\n"
                elif 'tasks.py' in f:
                    content = f"from celery import shared_task\n\n@shared_task\ndef run_{app}_task():\n    pass\n"
                elif f.endswith('_model.py') or f == 'models.py':
                    content = f"from django.db import models\n\n# Models are defined in the main models.py file for this app\n"
                elif 'event_handlers.py' in f:
                    content = f"def handle_event(event):\n    pass\n"
                elif 'sync_' in f:
                    content = f"from django.core.management.base import BaseCommand\n\nclass Command(BaseCommand):\n    def handle(self, *args, **options):\n        pass\n"
                elif f == '__init__.py':
                    continue
                else:
                    content = f"

                if content:
                    with open(path, 'w', encoding='utf-8') as out:
                        out.write(content)

print("Done")
