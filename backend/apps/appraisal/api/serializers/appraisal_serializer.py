# yss_orbit\backend\apps\appraisal\api\serializers\appraisal_serializer.py
from rest_framework import serializers
from apps.appraisal.models.appraisal import Appraisal

class AppraisalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appraisal
        fields = '__all__'
