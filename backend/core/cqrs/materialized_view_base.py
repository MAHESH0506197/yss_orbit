# yss_orbit\backend\core\cqrs\materialized_view_base.py
from django.db import models, connection
import logging

logger = logging.getLogger(__name__)

class MaterializedViewBase(models.Model):
    """
    Base abstract class for Materialized Views.
    In Django, a materialized view can be represented as an unmanaged model.
    The database handles the actual view definition.
    """
    class Meta:
        abstract = True
        managed = False  # Django shouldn't create/manage the table schema

    @classmethod
    def refresh_view(cls, concurrently: bool = True):
        """
        Refreshes the materialized view.
        Supports PostgreSQL's REFRESH MATERIALIZED VIEW syntax.
        """
        table_name = cls._meta.db_table
        concurrent_str = "CONCURRENTLY " if concurrently else ""
        query = f"REFRESH MATERIALIZED VIEW {concurrent_str}{table_name};"
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(query)
            logger.info(f"Successfully refreshed materialized view: {table_name}")
        except Exception as e:
            logger.error(f"Failed to refresh materialized view {table_name}: {e}")
            raise
