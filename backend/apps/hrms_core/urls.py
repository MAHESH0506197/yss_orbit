# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\urls.py
# DEPRECATED
# Use apps.hrms.models instead.
# Retained only for backward compatibility.

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyPolicyViewSet, HolidayViewSet

router = DefaultRouter()
router.register(r'policies', CompanyPolicyViewSet, basename='policy')
router.register(r'holidays', HolidayViewSet, basename='holiday')

urlpatterns = [
    path('', include(router.urls)),
]
