# yss_orbit\backend\apps\core\db_routers.py
"""
YSS Orbit — Database Router
Routes reads to replica for reporting/analytics apps.
All writes go to primary. All migrations go to primary.
"""
from __future__ import annotations

# Apps that should use the read replica for reads
_REPLICA_READ_APPS = frozenset([
    "reporting",
])


class PrimaryReplicaRouter:
    """
    Routes database queries:
    - Reporting/analytics reads → replica
    - All writes → primary
    - All migrations → primary
    - Everything else → primary (safe default)
    """

    def db_for_read(self, model: type, **hints: object) -> str:
        """Use replica for reporting queries only."""
        app_label = model._meta.app_label
        if app_label in _REPLICA_READ_APPS:
            return "replica"
        return "default"

    def db_for_write(self, model: type, **hints: object) -> str:
        """All writes go to primary."""
        return "default"

    def allow_relation(self, obj1: object, obj2: object, **hints: object) -> bool:
        """Allow all relations within the same db alias."""
        return True

    def allow_migrate(
        self, db: str, app_label: str, model_name: str | None = None, **hints: object
    ) -> bool:
        """Migrations only run on primary."""
        return db == "default"
