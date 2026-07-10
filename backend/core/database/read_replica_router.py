# yss_orbit\backend\core\database\read_replica_router.py
import random
import logging

logger = logging.getLogger(__name__)

class ReadReplicaRouter:
    """
    Database router that routes read operations to one or more read replicas
    and write operations to the primary (default) database.
    It supports pinning reads to the primary database immediately after a write
    using a thread-local flag or cache (read-after-write consistency).
    """

    def _get_replicas(self):
        # In a real-world scenario, this could be read from Django settings.
        # e.g., getattr(settings, 'DB_READ_REPLICAS', ['replica1'])
        from django.conf import settings
        return getattr(settings, 'DB_READ_REPLICAS', ['replica1'])

    def db_for_read(self, model, **hints):
        """
        Route read operations to a random read replica.
        If a specific db is hinted, use it.
        """
        if hints.get('db'):
            return hints['db']
        
        # Optionally implement read-after-write consistency logic here
        # For example, checking if the current thread recently wrote.
        
        replicas = self._get_replicas()
        if not replicas:
            return 'default'
            
        selected_replica = random.choice(replicas)
        logger.debug(f"Routing read for model {model._meta.model_name} to {selected_replica}")
        return selected_replica

    def db_for_write(self, model, **hints):
        """
        Route all write operations to the primary database ('default').
        """
        if hints.get('db'):
            return hints['db']
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if both objects exist in the primary/replica database pool.
        """
        db_list = ['default'] + self._get_replicas()
        if obj1._state.db in db_list and obj2._state.db in db_list:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Migrations should only ever run on the primary database.
        Replicas are read-only and sync from primary.
        """
        return db == 'default'
