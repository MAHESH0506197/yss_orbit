# yss_orbit\backend\core\responses\api_response.py
"""
YSS Orbit — Standard API Response Base

3.8 fix: E03 §5.2 / X02 — correlation_id is now injected into every response meta
from the thread-local SecurityContext. This enables full distributed tracing:
every response body and X-Correlation-Id response header share the same ID.
"""
from typing import Any, Dict, List, Optional, Union
from rest_framework.response import Response


class StandardAPIResponse(Response):
    """
    Base class for all YSS Orbit API responses.
    Enforces a consistent JSON structure: { success, status_code, code, message, data?, errors?, meta }.

    3.8 fix: correlation_id is auto-injected into meta from thread-local SecurityContext.
    """

    def __init__(
        self,
        success: bool,
        status_code: int,
        code: str,
        message: str,
        data: Optional[Any] = None,
        errors: Optional[Union[List[Any], Dict[str, Any]]] = None,
        meta: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs,
    ):
        # 3.8 fix: Auto-inject correlation_id into meta for distributed tracing (E03 §5.2)
        try:
            from core.security.security_context import SecurityContext
            correlation_id = SecurityContext.get_correlation_id()
        except Exception:
            correlation_id = None

        enriched_meta = dict(meta or {})
        if correlation_id:
            enriched_meta["correlation_id"] = correlation_id

        response_data: Dict[str, Any] = {
            "success": success,
            "status_code": status_code,
            "code": code,
            "message": message,
        }

        if data is not None:
            response_data["data"] = data

        if errors is not None:
            response_data["errors"] = errors

        if enriched_meta:
            response_data["meta"] = enriched_meta

        super().__init__(data=response_data, status=status_code, headers=headers, **kwargs)
