# yss_orbit\backend\apps\file_storage\selectors\file_storage_selectors.py
from apps.platform.models.file_asset_model import FileAsset
from django.db.models import QuerySet

class FileStorageSelectors:
    """
    Selector logic for FileAsset read operations.
    """
    @staticmethod
    def get_public_files() -> QuerySet[FileAsset]:
        return FileAsset.objects.filter(is_public=True)

    @staticmethod
    def get_tenant_files() -> QuerySet[FileAsset]:
        # Would normally filter by tenant ID via middleware
        return FileAsset.objects.all().order_by('-created_at')
