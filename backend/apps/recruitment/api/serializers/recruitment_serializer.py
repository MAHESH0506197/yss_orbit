# yss_orbit\backend\apps\recruitment\api\serializers\recruitment_serializer.py
from rest_framework import serializers
from apps.recruitment.models.recruitment_model import JobPosting, Applicant, Interview

class JobPostingSerializer(serializers.ModelSerializer):
    class Meta: model = JobPosting; fields = '__all__'

class ApplicantSerializer(serializers.ModelSerializer):
    class Meta: model = Applicant; fields = '__all__'

class InterviewSerializer(serializers.ModelSerializer):
    class Meta: model = Interview; fields = '__all__'\n