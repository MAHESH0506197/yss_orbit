# yss_orbit\backend\core\types\response_types.py
"""
Response type definitions.
"""
from typing import Any, Dict, Generic, TypeVar, Optional, List, TypedDict
from pydantic import BaseModel

T = TypeVar('T')

class SuccessResponseDict(TypedDict, Generic[T]):
    success: bool
    data: T
    meta: Dict[str, Any]

class ErrorResponseDict(TypedDict):
    success: bool
    error: Dict[str, Any]
    code: str
    message: str
