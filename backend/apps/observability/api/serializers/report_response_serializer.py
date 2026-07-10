# yss_orbit\backend\apps\reporting\api\serializers\report_response_serializer.py
from rest_framework import serializers

class BaseResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    data = serializers.DictField(required=False)
