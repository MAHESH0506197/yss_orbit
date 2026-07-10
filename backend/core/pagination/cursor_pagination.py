# yss_orbit\backend\core\pagination\cursor_pagination.py
"""
Cursor pagination implementation.
"""
from rest_framework.pagination import CursorPagination

class StandardCursorPagination(CursorPagination):
    """
    Standard cursor pagination for high-volume endpoints.
    Uses 'created_at' as the default ordering.
    """
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
    ordering = "-created_at"
