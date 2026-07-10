# yss_orbit\backend\apps\file_storage\api\serializers\file_storage_response_serializer.py
from rest_framework import serializers
from .file_storage_serializer import FileAssetSerializer

class FileStorageResponseSerializer(serializers.Serializer):
    """
    Standardized response structure for file storage endpoints.
    """
    status = serializers.CharField(default='success')
    message = serializers.CharField()
    data = FileAssetSerializer(many=True)
