import re

with open('c:/PROJECT/yss_orbit/backend/config/settings/base.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix middleware
content = content.replace('"core.middleware.idempotency.IdempotencyMiddleware",', '"apps.platform.middleware.idempotency.IdempotencyMiddleware",')
content = content.replace('"core.middleware.rate_limit.RateLimitMiddleware",', '"apps.platform.middleware.rate_limit.RateLimitMiddleware",')

# Fix DB router
content = content.replace('"core.db_routers.PrimaryReplicaRouter"', '"apps.platform.core_db_routers.PrimaryReplicaRouter"')

# Fix pagination
content = content.replace('"core.pagination.StandardResultsPagination"', '"apps.platform.core_pagination.StandardResultsPagination"')

# Fix exception handler
content = content.replace('"core.exceptions.global_exception_handler"', '"apps.platform.core_exceptions.global_exception_handler"')

with open('c:/PROJECT/yss_orbit/backend/config/settings/base.py', 'w', encoding='utf-8') as f:
    f.write(content)
