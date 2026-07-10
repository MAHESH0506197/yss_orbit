# yss_orbit\backend\core\database\health_checks.py
import logging
from django.db import connections
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)

def check_database_health() -> dict:
    """
    Checks the health of all configured databases.
    Returns a dictionary mapping database alias to its health status (boolean).
    """
    health_status = {}
    
    for alias in connections:
        try:
            connection = connections[alias]
            connection.cursor().execute("SELECT 1")
            health_status[alias] = {
                "status": "healthy",
                "message": "Connection successful."
            }
        except OperationalError as e:
            logger.error(f"Database health check failed for {alias}: {e}")
            health_status[alias] = {
                "status": "unhealthy",
                "message": str(e)
            }
        except Exception as e:
            logger.exception(f"Unexpected error during health check for {alias}: {e}")
            health_status[alias] = {
                "status": "unhealthy",
                "message": "Unexpected error occurred."
            }
            
    return health_status

def is_database_healthy() -> bool:
    """
    Returns True if all databases are healthy, False otherwise.
    """
    statuses = check_database_health()
    return all(info["status"] == "healthy" for info in statuses.values())
