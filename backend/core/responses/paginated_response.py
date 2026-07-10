# yss_orbit\backend\core\responses\paginated_response.py
from collections import OrderedDict
from rest_framework.pagination import PageNumberPagination
from .success_response import SuccessResponse


class StandardPagination(PageNumberPagination):
    """
    Standard pagination class for the application.
    Returns paginated responses wrapped in the StandardAPIResponse structure.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        meta = OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', self.page.paginator.num_pages),
            ('current_page', self.page.number),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link())
        ])
        
        return SuccessResponse(
            data=data,
            message="Data retrieved successfully.",
            meta=meta
        )
