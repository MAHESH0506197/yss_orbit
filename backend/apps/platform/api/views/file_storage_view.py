# yss_orbit\backend\apps\file_storage\api\views\file_storage_view.py
from rest_framework import viewsets, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.platform.models.file_asset_model import FileAsset
from apps.platform.api.serializers.file_storage_serializer import FileAssetSerializer
from .upload_view import FileUploadView

class FileStorageViewSet(viewsets.ModelViewSet):
    """
    Standard ViewSet for comprehensive CRUD on FileAssets.
    Upload is handled via a custom action or the dedicated UploadView.
    """
    serializer_class = FileAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'file_id'

    def get_queryset(self):
        return FileAsset.objects.all().order_by('-created_at')

    # Using the standard create for metadata only, but we can override it if we want to combine upload and metadata.
