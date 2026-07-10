# yss_orbit\backend\apps\recruitment\api\views\recruitment_view.py
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
    serializer_class = InterviewSerializer\n