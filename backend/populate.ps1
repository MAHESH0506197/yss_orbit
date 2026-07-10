# yss_orbit\backend\populate.ps1
$apps = @("payroll", "recruitment", "appraisal", "reporting")
$baseDir = "C:\PROJECT\yss_orbit\backend\apps"

foreach ($app in $apps) {
    $appDir = Join-Path $baseDir $app
    
    # Define models for each app
    $models = @()
    $modelImports = ""
    if ($app -eq "payroll") {
        $models = @("PayrollRun", "Payslip", "TDSSlab", "SalaryStructure", "SalaryComponent", "SalaryStructureComponent")
        $modelImports = "from apps.payroll.payroll_model import PayrollRun, Payslip, TDSSlab`nfrom apps.payroll.salary_component_model import SalaryStructure, SalaryComponent, SalaryStructureComponent"
    } elseif ($app -eq "recruitment") {
        $models = @("JobPosting", "InterviewStage", "Interview", "Applicant", "OfferLetter", "Recruitment")
        $modelImports = "from apps.recruitment.models import JobPosting, InterviewStage, Interview"
    } elseif ($app -eq "appraisal") {
        $models = @("AppraisalCycle", "KPI", "EmployeeAppraisal", "Feedback", "Review")
        $modelImports = "from apps.recruitment.models import AppraisalCycle, KPI, EmployeeAppraisal"
    } elseif ($app -eq "reporting") {
        $models = @("ReportTemplate", "ReportExecution")
        $modelImports = "from apps.reporting.models import ReportTemplate, ReportExecution"
    }

    $files = Get-ChildItem -Path $appDir -Recurse -File | Where-Object { $_.Extension -eq ".py" -and $_.Length -lt 100 }
    
    foreach ($file in $files) {
        $f = $file.Name
        $path = $file.FullName
        $content = ""
        
        if ($f -eq "admin.py") {
            $content = "from django.contrib import admin`n$modelImports`n`n"
            foreach ($m in $models) {
                if ($modelImports -match $m) {
                    $content += "@admin.register($m)`nclass $($m)Admin(admin.ModelAdmin):`n    list_display = ('id',)`n    search_fields = ('id',)`n`n"
                }
            }
        } elseif ($f -match "urls\.py") {
            $content = "from django.urls import path`n`nurlpatterns = [`n    # add paths here`n]`n"
        } elseif ($f -match "constants\.py" -or $f -match "analytics_constants\.py") {
            $content = "`"`"`"Constants for $app app.`"`"`"`n`nDEFAULT_PAGE_SIZE = 20`n"
        } elseif ($f -match "enums\.py" -or $f -match "analytics_enums\.py") {
            $content = "from django.db import models`n`nclass DefaultStatus(models.TextChoices):`n    ACTIVE = 'ACTIVE', 'Active'`n    INACTIVE = 'INACTIVE', 'Inactive'`n"
        } elseif ($f -match "events\.py" -or $f -match "analytics_events\.py") {
            $capApp = (Get-Culture).TextInfo.ToTitleCase($app)
            $content = "import dataclasses`n`n@dataclasses.dataclass`nclass Base$($capApp)Event:`n    event_id: str`n    timestamp: str`n"
        } elseif ($f -match "validators\.py") {
            $content = "from django.core.exceptions import ValidationError`n`ndef validate_positive(value):`n    if value < 0:`n        raise ValidationError('Value must be positive')`n"
        } elseif ($f -eq "permissions.py") {
            $capApp = (Get-Culture).TextInfo.ToTitleCase($app)
            $content = "from rest_framework.permissions import BasePermission`n`nclass Is$($capApp)Admin(BasePermission):`n    def has_permission(self, request, view):`n        return request.user and request.user.is_staff`n"
        } elseif ($f -match "^test_.*\.py$") {
            $testName = $f.Replace(".py", "")
            $content = "import pytest`n`n@pytest.mark.django_db`ndef test_default_$($app)_$($testName)():`n    assert True`n"
        } elseif ($f -eq "conftest.py") {
            $content = "import pytest`nfrom rest_framework.test import APIClient`n`n@pytest.fixture`ndef api_client():`n    return APIClient()`n"
        } elseif ($f -eq "factories.py") {
            $content = "import factory`n# define factories for $app`n"
        } elseif ($f -match "serializer\.py$") {
            $m = if ($models.Count -gt 0) { $models[0] } else { 'Default' }
            foreach ($md in $models) {
                if ($f.ToLower() -match $md.ToLower()) {
                    $m = $md
                    break
                }
            }
            if ($modelImports -match $m) {
                $content = "from rest_framework import serializers`n$modelImports`n`nclass $($m)Serializer(serializers.ModelSerializer):`n    class Meta:`n        model = $m`n        fields = '__all__'`n"
            } else {
                $content = "from rest_framework import serializers`n`nclass DefaultSerializer(serializers.Serializer):`n    id = serializers.IntegerField()`n"
            }
        } elseif ($f -match "view\.py$") {
            $m = if ($models.Count -gt 0) { $models[0] } else { 'Default' }
            foreach ($md in $models) {
                if ($f.ToLower() -match $md.ToLower()) {
                    $m = $md
                    break
                }
            }
            if ($modelImports -match $m) {
                $content = "from rest_framework import viewsets`n$modelImports`n# from .serializers import $($m)Serializer`n`nclass $($m)ViewSet(viewsets.ModelViewSet):`n    queryset = $($m).objects.all()`n    # serializer_class = $($m)Serializer`n"
            } else {
                $content = "from rest_framework.views import APIView`nfrom rest_framework.response import Response`n`nclass DefaultView(APIView):`n    def get(self, request):`n        return Response({'status': 'ok'})`n"
            }
        } elseif ($f -match "service\.py$") {
            $className = $f.Replace(".py", "").Replace("_", " ").Trim()
            $className = (Get-Culture).TextInfo.ToTitleCase($className).Replace(" ", "")
            $content = "class $($className):`n    @classmethod`n    def execute(cls):`n        pass`n"
        } elseif ($f -match "repository\.py$") {
            $className = $f.Replace(".py", "").Replace("_", " ").Trim()
            $className = (Get-Culture).TextInfo.ToTitleCase($className).Replace(" ", "")
            $content = "class $($className):`n    def get_all(self):`n        return []`n"
        } elseif ($f -match "selectors\.py$") {
            $content = "def get_$($app)_list():`n    return []`n"
        } elseif ($f -match "orchestrator\.py$") {
            $capApp = (Get-Culture).TextInfo.ToTitleCase($app)
            $content = "class $($capApp)Orchestrator:`n    def run(self):`n        pass`n"
        } elseif ($f -match "tasks\.py$") {
            $content = "from celery import shared_task`n`n@shared_task`ndef run_$($app)_task():`n    pass`n"
        } elseif ($f -match "_model\.py$" -or $f -eq "models.py") {
            $content = "from django.db import models`n`n# Models are defined in the main models.py file for this app`n"
        } elseif ($f -match "event_handlers\.py$") {
            $content = "def handle_event(event):`n    pass`n"
        } elseif ($f -match "sync_") {
            $content = "from django.core.management.base import BaseCommand`n`nclass Command(BaseCommand):`n    def handle(self, *args, **options):`n        pass`n"
        } elseif ($f -eq "__init__.py") {
            continue
        } else {
            $content = "# TODO: Implement $f`n"
        }

        if ($content -ne "") {
            Set-Content -Path $path -Value $content -Encoding UTF8
        }
    }
}
Write-Host "Done populating files."
