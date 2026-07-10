# yss_orbit\backend\core\database\db_router.py
from .read_replica_router import ReadReplicaRouter

class DatabaseRouter(ReadReplicaRouter):
    """
    Primary database router for the application.
    Inherits from ReadReplicaRouter and can be extended for module-specific routing
    (e.g., routing a specific app to a separate database shard).
    """
    pass
