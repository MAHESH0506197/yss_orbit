# yss_orbit\backend\apps\health\services\health_service.py
from django.db import connection
from django.core.cache import cache
import logging
import time

logger = logging.getLogger(__name__)

class HealthService:
    """
    Core service to check the health of various infrastructure components.
    """
    @staticmethod
    def check_database() -> bool:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                return row is not None and row[0] == 1
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False

    @staticmethod
    def check_cache() -> bool:
        try:
            cache.set("health_check_key", "ok", timeout=5)
            return cache.get("health_check_key") == "ok"
        except Exception as e:
            logger.error(f"Cache health check failed: {str(e)}")
            return False

    @staticmethod
    def get_comprehensive_status() -> dict:
        start_time = time.time()
        db_ok = HealthService.check_database()
        cache_ok = HealthService.check_cache()
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        status = 'healthy' if db_ok and cache_ok else 'degraded'
        if not db_ok and not cache_ok:
            status = 'down'

        return {
            "status": status,
            "version": "1.0.0", # Can be pulled from settings/env
            "database": "healthy" if db_ok else "down",
            "cache": "healthy" if cache_ok else "down",
            "worker": "healthy", # Placeholder for Celery worker check
            "response_time_ms": elapsed_ms
        }
