# yss_orbit\backend\core\validators\request_validators.py
"""
Request validators.
"""
def validate_pagination_params(page: int, page_size: int):
    if page < 1:
        raise ValueError("Page must be greater than 0.")
    if page_size < 1 or page_size > 100:
        raise ValueError("Page size must be between 1 and 100.")
