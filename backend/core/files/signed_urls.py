# yss_orbit\backend\core\files\signed_urls.py
"""
Signed URL generation.
"""
class SignedUrlGenerator:
    @staticmethod
    def generate_download_url(file_path: str, expires_in_seconds: int = 3600) -> str:
        """
        Generate a pre-signed S3 URL for downloading.
        """
        # Placeholder for boto3 presigned url generation
        return f"/media/{file_path}?signed=true"
        
    @staticmethod
    def generate_upload_url(file_path: str, content_type: str, expires_in_seconds: int = 3600) -> str:
        """
        Generate a pre-signed S3 URL for direct client uploads.
        """
        return f"/media/upload/{file_path}?signed=true"
