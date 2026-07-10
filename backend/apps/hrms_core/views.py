# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\views.py
# DEPRECATED
# Use apps.hrms.models instead.
# Retained only for backward compatibility.

from rest_framework import viewsets
from .models import CompanyPolicy, Holiday
from .serializers import CompanyPolicySerializer, HolidaySerializer

class CompanyPolicyViewSet(viewsets.ModelViewSet):
    queryset = CompanyPolicy.objects.all()
    serializer_class = CompanyPolicySerializer

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
