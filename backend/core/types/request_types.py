# yss_orbit\backend\core\types\request_types.py
"""
Request and response type definitions.
"""
from typing import Any, Dict, Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 25
    cursor: Optional[str] = None
    ordering: Optional[str] = None
