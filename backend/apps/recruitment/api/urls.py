# yss_orbit\backend\apps\recruitment\api\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.recruitment.api.views.applicant_view import ApplicantViewSet\nfrom apps.recruitment.api.views.interview_view import InterviewViewSet\nfrom apps.recruitment.api.views.job_posting_view import JobPostingViewSet\nfrom apps.recruitment.api.views.offer_letter_view import OfferLetterViewSet\nfrom apps.recruitment.api.views.recruitment_view import RecruitmentViewSet

router = DefaultRouter()
router.register(r'applicants', ApplicantViewSet, basename='applicant')\nrouter.register(r'interviews', InterviewViewSet, basename='interview')\nrouter.register(r'job_postings', JobPostingViewSet, basename='job_posting')\nrouter.register(r'offer_letters', OfferLetterViewSet, basename='offer_letter')\nrouter.register(r'recruitments', RecruitmentViewSet, basename='recruitment')

urlpatterns = [
    path('', include(router.urls)),
]
