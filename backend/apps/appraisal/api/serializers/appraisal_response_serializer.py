# yss_orbit\backend\apps\appraisal\api\serializers\appraisal_response_serializer.py
from rest_framework import serializers

class BaseResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    data = serializers.DictField(required=False)
