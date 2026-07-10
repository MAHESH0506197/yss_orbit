# yss_orbit\backend\implement_hr_expert_p2.py
import os

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

APPS_TO_IMPLEMENT = {
    "recruitment": {
        "models": {
            "recruitment_model.py": """
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
"""
        },
        "api/serializers": {
            "recruitment_serializer.py": """
from rest_framework import serializers
from apps.recruitment.models.recruitment_model import JobPosting, Applicant, Interview

class JobPostingSerializer(serializers.ModelSerializer):
    class Meta: model = JobPosting; fields = '__all__'

class ApplicantSerializer(serializers.ModelSerializer):
    class Meta: model = Applicant; fields = '__all__'

class InterviewSerializer(serializers.ModelSerializer):
    class Meta: model = Interview; fields = '__all__'
"""
        },
        "api/views": {
            "recruitment_view.py": """
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.recruitment.models.recruitment_model import JobPosting, Applicant, Interview
from apps.recruitment.api.serializers.recruitment_serializer import JobPostingSerializer, ApplicantSerializer, InterviewSerializer

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer

class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all()
    serializer_class = ApplicantSerializer
    
    @action(detail=True, methods=['post'])
    def advance_status(self, request, pk=None):
        applicant = self.get_object()
        new_status = request.data.get('status')
        applicant.status = new_status
        applicant.save()
        return Response({'status': new_status})

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
"""
        }
    },
    "leave": {
        "models.py": """
from django.db import models
from apps.platform.models.base import TenantModel

class LeaveSetting(TenantModel):
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
"""
    }
}

for app_name, modules in APPS_TO_IMPLEMENT.items():
    app_dir = os.path.join(base_dir, app_name)
    os.makedirs(app_dir, exist_ok=True)
    
    for module_path, files in modules.items():
        if module_path.endswith('.py'):
            with open(os.path.join(app_dir, module_path), "w") as f:
                f.write(files.strip() + "\\n")
            continue
            
        module_dir = os.path.join(app_dir, module_path.replace("/", os.sep))
        os.makedirs(module_dir, exist_ok=True)
        
        init_file = os.path.join(module_dir, "__init__.py")
        if not os.path.exists(init_file):
            open(init_file, "w").close()
            
        for file_name, content in files.items():
            file_path = os.path.join(module_dir, file_name)
            with open(file_path, "w") as f:
                f.write(content.strip() + "\\n")
            print(f"Wrote {file_path}")

print("Done p2!")
