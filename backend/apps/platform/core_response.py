# yss_orbit\backend\apps\core\response.py
"""
YSS Orbit — Standardized API Response Builder
ALL API responses use these builders for consistency.
Every response carries correlation_id in meta and X-Correlation-Id header.
"""
from __future__ import annotations

import datetime
from typing import Any

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response


def _get_correlation_id(request: Request | None = None) -> str:
    """Extract correlation_id from request or return fallback."""
    if request is not None:
        return getattr(request, "correlation_id", "unknown")
    return "unknown"


def _build_meta(
    request: Request | None = None,
    extra_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build standard response meta object."""
    meta: dict[str, Any] = {
        "correlation_id": _get_correlation_id(request),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }
    if extra_meta:
        meta.update(extra_meta)
    return meta


def success_response(
    data: Any = None,
    message: str | None = None,
    meta: dict[str, Any] | None = None,
    http_status: int = status.HTTP_200_OK,
    request: Request | None = None,
) -> Response:
    """
    Build a successful API response.

    Shape:
    {
        "success": true,
        "data": {...},
        "message": "Optional message",
        "meta": {"correlation_id": "...", "timestamp": "..."}
    }
    """
    body: dict[str, Any] = {
        "success": True,
        "data": data,
        "meta": _build_meta(request, meta),
    }
    if message:
        body["message"] = message

    response = Response(body, status=http_status)
    response["X-Correlation-Id"] = _get_correlation_id(request)
    return response


def created_response(
    data: Any = None,
    message: str = "Resource created successfully.",
    request: Request | None = None,
) -> Response:
    """Convenience wrapper for 201 Created."""
    return success_response(
        data=data,
        message=message,
        http_status=status.HTTP_201_CREATED,
        request=request,
    )


def no_content_response(request: Request | None = None) -> Response:
    """204 No Content — for DELETE operations."""
    response = Response(status=status.HTTP_204_NO_CONTENT)
    response["X-Correlation-Id"] = _get_correlation_id(request)
    return response


def accepted_response(
    job_id: str,
    message: str = "Request accepted. Processing in background.",
    status_url: str | None = None,
    request: Request | None = None,
) -> Response:
    """
    202 Accepted — for long-running background jobs.
    Frontend polls /api/v1/jobs/{job_id}/ or listens via SSE.
    """
    data: dict[str, Any] = {
        "job_id": job_id,
        "message": message,
    }
    if status_url:
        data["status_url"] = status_url

    return success_response(
        data=data,
        http_status=status.HTTP_202_ACCEPTED,
        request=request,
    )


def error_response(
    error_code: str,
    message: str,
    details: dict[str, Any] | None = None,
    http_status: int = status.HTTP_400_BAD_REQUEST,
    request: Request | None = None,
) -> Response:
    """
    Build an error API response.

    Shape:
    {
        "success": false,
        "error": {
            "code": "AUTH_001",
            "message": "...",
            "details": {}
        },
        "meta": {"correlation_id": "..."}
    }
    """
    body: dict[str, Any] = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details or {},
        },
        "meta": _build_meta(request),
    }
    response = Response(body, status=http_status)
    response["X-Correlation-Id"] = _get_correlation_id(request)
    return response


def paginated_response(
    data: list[Any],
    count: int,
    next_cursor: str | None = None,
    previous_cursor: str | None = None,
    next_url: str | None = None,
    previous_url: str | None = None,
    meta: dict[str, Any] | None = None,
    request: Request | None = None,
) -> Response:
    """
    Build a paginated list response.

    Shape:
    {
        "success": true,
        "data": {
            "results": [...],
            "count": 150,
            "next": "...",
            "previous": "..."
        },
        "meta": {"correlation_id": "...", "timestamp": "..."}
    }
    """
    pagination: dict[str, Any] = {
        "results": data,
        "count": count,
        "next": next_url or next_cursor,
        "previous": previous_url or previous_cursor,
    }

    body: dict[str, Any] = {
        "success": True,
        "data": pagination,
        "meta": _build_meta(request, meta),
    }
    response = Response(body, status=status.HTTP_200_OK)
    response["X-Correlation-Id"] = _get_correlation_id(request)
    return response
