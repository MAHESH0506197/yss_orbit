# yss_orbit\backend\apps\file_storage\services\upload_service.py
from apps.platform.models.file_asset_model import FileAsset
from apps.platform.services.virus_scan_service import VirusScanService
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class UploadService:
    """
    Coordinates the process of securely receiving a file, scanning it for viruses,
    saving the metadata, and handing off to the storage layer.
    """
    @staticmethod
    def process_upload(file_content: bytes, original_name: str, mime_type: str, size: int, is_public: bool = False) -> FileAsset:
        # 1. Virus Scan
        if not VirusScanService.scan_file(file_content, original_name):
            raise ValidationError("File failed virus scan. Upload rejected.")
            
        # 2. Upload to S3 / Cloud (Mocked here)
        storage_path = f"assets/{original_name}"
        logger.info(f"File {original_name} uploaded successfully to {storage_path}")

        # 3. Create DB Record
        asset = FileAsset.objects.create(
            original_name=original_name,
            mime_type=mime_type,
            size_bytes=size,
            storage_path=storage_path,
            is_public=is_public
        )
        return asset
