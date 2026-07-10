# yss_orbit\backend\apps\file_storage\api\serializers\file_storage_serializer.py
from rest_framework import serializers
from apps.platform.models.file_asset_model import FileAsset

class FileAssetSerializer(serializers.ModelSerializer):
    """
    Serializer for the FileAsset model.
    Provides metadata about the uploaded file without exposing the direct storage path publicly unless requested.
    """
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = FileAsset
        fields = ['file_id', 'original_name', 'mime_type', 'size_bytes', 'is_public', 'download_url', 'created_at']
        read_only_fields = ['file_id', 'mime_type', 'size_bytes', 'download_url', 'created_at']

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f"/api/v1/storage/download/{obj.file_id}/")
        return f"/api/v1/storage/download/{obj.file_id}/"
