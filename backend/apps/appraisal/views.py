# yss_orbit\backend\apps\appraisal\views.py
from rest_framework import viewsets
from .models.appraisal_model import Appraisal
from .models import AppraisalCycle, KPI
from .serializers import AppraisalCycleSerializer, KPISerializer, AppraisalSerializer

class AppraisalCycleViewSet(viewsets.ModelViewSet):
    queryset = AppraisalCycle.objects.all()
    serializer_class = AppraisalCycleSerializer

class KPIViewSet(viewsets.ModelViewSet):
    queryset = KPI.objects.all()
    serializer_class = KPISerializer

class AppraisalViewSet(viewsets.ModelViewSet):
    queryset = Appraisal.objects.all()
    serializer_class = AppraisalSerializer
