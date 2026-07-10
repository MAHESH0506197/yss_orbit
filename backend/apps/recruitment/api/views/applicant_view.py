# yss_orbit\backend\apps\recruitment\api\views\applicant_view.py
from rest_framework import viewsets, permissions
from apps.recruitment.models.applicant import Applicant
from apps.recruitment.api.serializers.applicant_serializer import ApplicantSerializer

class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all()
    serializer_class = ApplicantSerializer
    permission_classes = [permissions.IsAuthenticated]
