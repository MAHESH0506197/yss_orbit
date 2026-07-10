# yss_orbit\backend\core\files\storage.py
"""
File storage implementations.
"""
from django.core.files.storage import FileSystemStorage

class PrivateTenantStorage(FileSystemStorage):
    """
    Storage for private tenant files that should not be publicly accessible.
    In production, this would inherit from S3Boto3Storage with private ACLs.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.location = 'private_media/'
