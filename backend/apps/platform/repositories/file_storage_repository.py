# yss_orbit\backend\apps\file_storage\repositories\file_storage_repository.py
from apps.platform.models.file_asset_model import FileAsset

class FileStorageRepository:
    """
    Data Access Layer for FileAsset.
    """
    @staticmethod
    def get_by_id(file_id: str) -> FileAsset:
        return FileAsset.objects.get(file_id=file_id)

    @staticmethod
    def delete(file_id: str) -> None:
        FileAsset.objects.filter(file_id=file_id).delete()
