# yss_orbit\backend\apps\recruitment\api\views\job_posting_view.py
from rest_framework import viewsets, permissions
from apps.recruitment.models.job_posting import JobPosting
from apps.recruitment.api.serializers.job_posting_serializer import JobPostingSerializer

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated]
