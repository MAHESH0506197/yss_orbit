# yss_orbit\backend\apps\recruitment\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views.recruitment_view import JobPostingViewSet, ApplicantViewSet, InterviewViewSet

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet, basename='job-posting')
router.register(r'applicants', ApplicantViewSet, basename='applicant')
router.register(r'interviews', InterviewViewSet, basename='interview')

urlpatterns = [
    path('', include(router.urls)),
]\n