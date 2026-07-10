# yss_orbit\backend\apps\file_storage\api\views\file_storage_detail_view.py
from rest_framework import generics, permissions
from apps.platform.models.file_asset_model import FileAsset
from apps.platform.api.serializers.file_storage_serializer import FileAssetSerializer

class FileStorageDetailView(generics.RetrieveDestroyAPIView):
    """
    API view to retrieve metadata or delete a specific file asset.
    """
    serializer_class = FileAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'file_id'

    def get_queryset(self):
        return FileAsset.objects.all()

    def perform_destroy(self, instance):
        # Placeholder to also delete from S3/cloud storage before deleting DB record
        instance.delete()
