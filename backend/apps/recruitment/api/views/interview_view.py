# yss_orbit\backend\apps\recruitment\api\views\interview_view.py
from rest_framework import viewsets, permissions
from apps.recruitment.models.interview import Interview
from apps.recruitment.api.serializers.interview_serializer import InterviewSerializer

class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
