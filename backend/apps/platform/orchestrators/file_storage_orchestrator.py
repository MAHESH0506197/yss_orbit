# yss_orbit\backend\apps\file_storage\orchestrators\file_storage_orchestrator.py
from apps.platform.services.upload_service import UploadService
from apps.platform.services.signed_url_service import SignedUrlService

class FileStorageOrchestrator:
    """
    High level orchestrator combining upload processing and signed URL generation.
    """
    @staticmethod
    def initialize_client_upload(mime_type: str, original_filename: str) -> dict:
        """
        Orchestrates returning a pre-signed S3 URL to the frontend so the client 
        can upload directly to the cloud, bypassing the Django backend bandwidth.
        """
        return SignedUrlService.generate_upload_url(mime_type, original_filename)
