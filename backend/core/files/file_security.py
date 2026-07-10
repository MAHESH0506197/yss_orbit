# yss_orbit\backend\core\files\file_security.py
"""
File security utilities.
"""
import mimetypes
from core.exceptions import ValidationException

def verify_file_security(file_obj):
    """
    Verify basic security attributes of a file.
    """
    if file_obj.size > 10 * 1024 * 1024:
        raise ValidationException("File size exceeds 10MB limit.")
        
    mime_type, _ = mimetypes.guess_type(file_obj.name)
    if mime_type in ["application/x-executable", "application/javascript"]:
        raise ValidationException("Executable files are not allowed.")
