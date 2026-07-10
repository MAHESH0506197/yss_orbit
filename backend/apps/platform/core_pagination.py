# yss_orbit\backend\apps\core\pagination.py
"""
YSS Orbit — Pagination Classes
All list endpoints use one of these pagination classes.
Responses always include count, next, previous in standard format.
"""
from __future__ import annotations

from rest_framework.pagination import CursorPagination, LimitOffsetPagination
from rest_framework.response import Response
from typing import Any


class StandardResultsPagination(LimitOffsetPagination):
    """
    Standard limit/offset pagination for regular lists.
    Used for most endpoints where cursor pagination is not required.
    Max 100 records per page to prevent abuse.
    """
    default_limit = 25
    max_limit = 100
    limit_query_param = "limit"
    offset_query_param = "offset"

    def get_paginated_response(self, data: list[Any]) -> Response:
        return Response({
            "success": True,
            "data": {
                "count": self.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            },
            "meta": {
                "total_pages": -(-self.count // self.limit) if self.limit else 1,
                "current_limit": self.limit,
                "current_offset": self.offset,
            },
        })

    def get_paginated_response_schema(self, schema: dict) -> dict:
        return {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "data": {
                    "type": "object",
                    "properties": {
                        "count": {"type": "integer"},
                        "next": {"type": "string", "nullable": True},
                        "previous": {"type": "string", "nullable": True},
                        "results": schema,
                    },
                },
            },
        }


class CursorResultsPagination(CursorPagination):
    """
    Cursor-based pagination for high-volume lists (>10K rows).
    Use for: audit logs, event outbox, stock transactions, notifications.
    Cursor is opaque — clients must not parse it.
    """
    page_size = 25
    max_page_size = 100
    page_size_query_param = "page_size"
    ordering = "-created_at"  # Default ordering for cursor pagination

    def get_paginated_response(self, data: list[Any]) -> Response:
        return Response({
            "success": True,
            "data": {
                "count": None,  # Cursor pagination doesn't support count
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            },
        })
