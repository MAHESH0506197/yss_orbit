# yss_orbit\backend\apps\appraisal\api\views\appraisal_view.py
from rest_framework import viewsets, permissions
from apps.appraisal.models.appraisal import Appraisal
from apps.appraisal.api.serializers.appraisal_serializer import AppraisalSerializer
from apps.iam.permissions.hrms_permissions import IsNotSelfEdit

class AppraisalViewSet(viewsets.ModelViewSet):
    queryset = Appraisal.objects.all()
    serializer_class = AppraisalSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotSelfEdit]
