# yss_orbit\backend\core\database\query_utils.py
from typing import Type, TypeVar, Iterable
from django.db import models
from django.db.models import QuerySet

T = TypeVar('T', bound=models.Model)

def get_object_or_none(model: Type[T], **kwargs) -> T | None:
    """
    Returns an object of the given model if it exists, otherwise returns None.
    More efficient than get_object_or_404 for internal use where 404 is not appropriate.
    """
    try:
        return model.objects.get(**kwargs)
    except model.DoesNotExist:
        return None
    except model.MultipleObjectsReturned:
        # Depending on use case, might want to raise, or log warning
        raise

def bulk_update_with_history(queryset: QuerySet, update_kwargs: dict, user_id: int = None) -> int:
    """
    Perform a bulk update and potentially record historical records or audit logs.
    This is a stub for enterprise scenarios where direct bulk_update bypassing save() 
    causes issues with audit trails.
    """
    # E.g., emitting an event or writing to an audit table
    return queryset.update(**update_kwargs)

def paginate_queryset(queryset: QuerySet, page: int, page_size: int) -> QuerySet:
    """
    Standard offset/limit pagination utility.
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
        
    offset = (page - 1) * page_size
    return queryset[offset:offset + page_size]

def fetch_large_queryset_in_chunks(queryset: QuerySet, chunk_size: int = 2000) -> Iterable:
    """
    Efficiently iterates over a large queryset using server-side cursors 
    or id-based pagination (if ordered by PK) to prevent memory bloat.
    """
    # Assuming ordered by PK for id-based keyset pagination which is faster than offset
    last_id = None
    while True:
        chunk = queryset
        if last_id is not None:
            chunk = chunk.filter(pk__gt=last_id)
        chunk = list(chunk[:chunk_size])
        if not chunk:
            break
        yield from chunk
        last_id = chunk[-1].pk
