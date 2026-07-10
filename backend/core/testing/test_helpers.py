# yss_orbit\backend\core\testing\test_helpers.py
"""
Testing utilities.
"""
from django.core.cache import cache

def clear_caches():
    """Clear all django caches. Useful in test teardown."""
    cache.clear()
