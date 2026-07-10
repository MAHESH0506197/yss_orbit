# yss_orbit\backend\apps\recruitment\api\serializers\applicant_serializer.py
from rest_framework import serializers
from apps.recruitment.models.applicant import Applicant

class ApplicantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Applicant
        fields = '__all__'
