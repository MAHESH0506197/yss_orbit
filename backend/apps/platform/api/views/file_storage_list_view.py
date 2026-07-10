# yss_orbit\backend\apps\file_storage\api\views\file_storage_list_view.py
from rest_framework import generics, permissions
from apps.platform.models.file_asset_model import FileAsset
from apps.platform.api.serializers.file_storage_serializer import FileAssetSerializer

class FileStorageListView(generics.ListAPIView):
    """
    API view to retrieve list of all files uploaded by the authenticated tenant.
    """
    serializer_class = FileAssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FileAsset.objects.all().order_by('-created_at')
