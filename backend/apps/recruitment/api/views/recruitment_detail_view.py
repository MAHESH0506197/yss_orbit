# yss_orbit\backend\apps\recruitment\api\views\recruitment_detail_view.py
from rest_framework import viewsets, permissions
from apps.recruitment.models.recruitment import Recruitment
from apps.recruitment.api.serializers.recruitment_serializer import RecruitmentSerializer

class RecruitmentViewSet(viewsets.ModelViewSet):
    queryset = Recruitment.objects.all()
    serializer_class = RecruitmentSerializer
    permission_classes = [permissions.IsAuthenticated]
