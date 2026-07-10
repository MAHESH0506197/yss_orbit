# yss_orbit\backend\apps\appraisal\api\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.appraisal.api.views.appraisal_view import AppraisalViewSet\nfrom apps.appraisal.api.views.feedback_view import FeedbackViewSet\nfrom apps.appraisal.api.views.kpi_view import KpiViewSet\nfrom apps.appraisal.api.views.review_cycle_view import ReviewCycleViewSet

router = DefaultRouter()
router.register(r'appraisals', AppraisalViewSet, basename='appraisal')\nrouter.register(r'feedbacks', FeedbackViewSet, basename='feedback')\nrouter.register(r'kpis', KpiViewSet, basename='kpi')\nrouter.register(r'review_cycles', ReviewCycleViewSet, basename='review_cycle')

urlpatterns = [
    path('', include(router.urls)),
]
