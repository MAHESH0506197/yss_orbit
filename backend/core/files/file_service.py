# yss_orbit\backend\core\files\file_service.py
"""
High level file service.
"""
from core.services.service_result import ServiceResult
from .file_security import verify_file_security
from .virus_scanner import VirusScanner

class FileService:
    @staticmethod
    def process_upload(file_obj) -> ServiceResult[str]:
        try:
            verify_file_security(file_obj)
            scan_result = VirusScanner.scan(file_obj)
            if not scan_result.is_success:
                return ServiceResult.failure("Virus detected in file.")
            
            # Save file logic would go here
            return ServiceResult.success(f"saved_{file_obj.name}")
        except Exception as e:
            return ServiceResult.failure(str(e))
