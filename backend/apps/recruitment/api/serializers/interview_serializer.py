# yss_orbit\backend\apps\recruitment\api\serializers\interview_serializer.py
from rest_framework import serializers
from apps.recruitment.models.interview import Interview

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
