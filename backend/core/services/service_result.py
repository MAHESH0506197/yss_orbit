# yss_orbit\backend\core\services\service_result.py
"""
Standardized Service Result Object.
"""
from typing import Any, Generic, TypeVar, Optional, Dict
from pydantic import BaseModel

T = TypeVar('T')

class ServiceResult(Generic[T]):
    """
    Standard return object for all domain services.
    Ensures domain logic doesn't leak HTTP semantics (like DRF Responses).
    """
    def __init__(self, is_success: bool, data: Optional[T] = None, error: Optional[str] = None, error_code: Optional[str] = None):
        self.is_success = is_success
        self.data = data
        self.error = error
        self.error_code = error_code

    @classmethod
    def success(cls, data: Optional[T] = None) -> 'ServiceResult[T]':
        return cls(is_success=True, data=data)

    @classmethod
    def failure(cls, error: str, error_code: str = "SERVICE_ERROR") -> 'ServiceResult[Any]':
        return cls(is_success=False, error=error, error_code=error_code)
