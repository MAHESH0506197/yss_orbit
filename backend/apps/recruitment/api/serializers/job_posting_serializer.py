# yss_orbit\backend\apps\recruitment\api\serializers\job_posting_serializer.py
from rest_framework import serializers
from apps.recruitment.models.job_posting import JobPosting

class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = '__all__'
