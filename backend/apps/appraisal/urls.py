# yss_orbit\backend\apps\appraisal\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppraisalCycleViewSet, KPIViewSet, AppraisalViewSet

router = DefaultRouter()
router.register(r'cycles', AppraisalCycleViewSet, basename='appraisal-cycle')
router.register(r'kpis', KPIViewSet, basename='kpi')
router.register(r'employee-appraisals', AppraisalViewSet, basename='employee-appraisal')

urlpatterns = [
    path('', include(router.urls)),
]
