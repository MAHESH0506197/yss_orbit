<!-- yss_orbit\rulebooks\B13 - ASYNC PROCESSING, CACHING & PERFORMANCE.md -->
# B13 - ASYNC PROCESSING, CACHING & PERFORMANCE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B04 (Application Architecture), B07 (RBAC)
**Governance Role:** Async & Cache Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Async processing rules, task queue usage, cache key standards, cache TTL standards, cache reliability patterns, slow query enforcement, rate limiting for heavy ops, batch processing standards, task retry governance, dead-letter handling |
| REFERENCES | B01 (background job rules §5.29, cache rules §5.22), B02 (tenant-safe cache keys), B07 (RBAC in background jobs), B15 (task audit logging) |
| MUST NOT DUPLICATE | Full background job governance (B01 §5.29), cache law (B01 §5.22), tenant isolation (B02), rate limiting law (B01 §5.24) |

---

## 1. PURPOSE

This rulebook defines **performance and scalability standards** for YSS Orbit.

It establishes:
- Asynchronous processing rules
- Caching strategies and reliability
- Cache TTL standards
- System performance optimization
- Slow query monitoring

All performance-critical operations MUST follow these rules.

---

## 2. SCOPE

Applies to: background jobs (Celery, workers, schedulers), caching layers (Redis, in-memory), API performance optimization, heavy data processing tasks. No performance-critical operation is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Async Processing (MANDATORY)

- Long-running operations MUST be executed asynchronously
- Blocking operations in the API request lifecycle are PROHIBITED
- Long-running tasks include: report generation, bulk imports, email notifications, file processing, third-party API calls that may be slow

### 3.2 Task Queue Usage (MANDATORY)

- Async tasks MUST use a queue system (Celery + Redis/Valkey)
- Direct background thread execution without a queue is PROHIBITED
- Task queues MUST be monitored for depth, failure rate, and latency

### 3.3 Task Design (MANDATORY)

- Tasks MUST be idempotent (safe to run multiple times with same result)
- Tasks MUST be retry-safe (no duplicate side effects on retry)
- Tasks MUST have a timeout - infinite execution is PROHIBITED
- Tasks MUST call Service Layer - business logic inside tasks is PROHIBITED
- Tasks MUST NOT access database directly outside the Service/Repository chain
- Tasks MUST NOT receive HTTP request objects - only plain IDs and data

### 3.4 Tenant Isolation in Background Jobs (MANDATORY)

- All tenant-owned background jobs MUST include `business_unit_id` in the task payload
- Jobs MUST reconstruct or receive an approved system `security_context`
- Jobs MUST NOT run unscoped tenant queries
- Retry jobs MUST preserve the original `business_unit_id` - MUST NOT expand tenant access on retry
- Scheduled jobs MUST enforce tenant isolation

**Violation:** Background job processing tenant data without `business_unit_id` = CRITICAL violation.

### 3.5 Retry & Failure Handling (MANDATORY)

- Failed tasks MUST be retried using exponential backoff
- Infinite retry loops are PROHIBITED
- Maximum retry count MUST be defined per task
- Dead-letter queues MUST handle exhausted jobs
- Dead-letter events MUST trigger monitoring alerts

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_task(self, business_unit_id: str, data: dict):
    try:
        service.process(business_unit_id, data)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 60)
```

### 3.6 Cache Scope (MANDATORY)

Cache keys for tenant-owned or user-specific data MUST include tenant and/or user scope.

Required key formats:

```text
{module}:{business_unit_id}:{resource_identifier}
{module}:{user_id}:{business_unit_id}:{resource_identifier}
```

Examples:
```text
inventory:bu-uuid:all                          ✅
permissions:user-uuid:bu-uuid                  ✅
dashboard:user-uuid:bu-uuid:summary            ✅
domains:all                                    ✅ Reference data (global key allowed)
module_access:{business_unit_id}:{module_code}    ✅ Module subscription status (TTL: 300s)
feature:{business_unit_id}:{feature_code}          ✅ Feature flag status (TTL: 300s)
subscription_plan:{business_unit_id}               ✅ Subscription plan (TTL: 300s)

inventory_list                                 ❌ No tenant scope
permissions                                    ❌ No user scope
dashboard_stats                                ❌ Shared across tenants
```

**Violation:** Unscoped cache key for tenant data = cross-tenant cache leakage (CRITICAL).

### 3.7 Cache Invalidation (MANDATORY)

- Cache MUST be invalidated on every INSERT, UPDATE, and DELETE
- Stale cache serving incorrect data is PROHIBITED
- Cache invalidation MUST happen in the Service Layer after write operations
- Permission cache MUST be invalidated on role changes, permission assignment changes, and UserBusinessUnit membership changes

### 3.8 Cache Reliability (MANDATORY)

Cache failure MUST NOT crash the application or bypass authorization.

Canonical cache pattern (REQUIRED):

```python
def get_data(self, business_unit_id: str) -> list:
    cache_key = f"inventory:{business_unit_id}:all"
    try:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
    except Exception as e:
        logger.warning(f"Cache GET failed for {cache_key}: {e}")
        # Fall through to DB - do NOT raise

    data = self.repo.fetch_all(business_unit_id)

    try:
        cache.set(cache_key, data, timeout=INVENTORY_CACHE_TTL)
    except Exception as e:
        logger.warning(f"Cache SET failed for {cache_key}: {e}")
        # Do not raise - cache failure must NOT crash the operation

    return data
```

Rules:
- Cache GET failures MUST fall back to DB - NEVER raise exception to caller
- Cache SET failures MUST be logged as WARNING - NEVER raise exception to caller
- Cache failures MUST NOT bypass authorization or tenant checks

### 3.9 Cache TTL Standards (MANDATORY)

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User permissions | 300s (5 min) | Refresh on role/permission changes |
| Navigation menu | 300s (5 min) | Refresh on permission changes |
| Inventory list | 60s (1 min) | High churn |
| Dashboard summaries | 30s | Near-real-time |
| Master/reference data | 3600s (1 hr) | Rarely changes |
| User profile | 120s (2 min) | Moderate churn |

Rules:
- TTL values MUST be defined as named constants - magic numbers are PROHIBITED
- Sensitive data (passwords, tokens, raw PII, financial real-time data) MUST NEVER be cached

### 3.10 Batch Processing (MANDATORY)

- Bulk operations MUST be batched (e.g., 500 records per batch)
- Large single batch operations that risk memory exhaustion are PROHIBITED
- Batch jobs MUST be tenant-safe - each batch MUST belong to one BusinessUnit

### 3.11 Slow Query Enforcement (MANDATORY)

All database queries MUST be timed. See B10 §3.12 for slow query threshold enforcement.

- Queries > 200ms MUST log WARNING
- Queries > 500ms MUST log CRITICAL and alert monitoring

### 3.12 Timeout Handling (MANDATORY)

- Every task MUST have a timeout
- Every external API call MUST have a timeout
- Infinite execution is PROHIBITED

### 3.13 Task Logging (MANDATORY)

All async task execution MUST be logged:

```json
{
  "task_name": "process_payroll_export",
  "business_unit_id": "uuid",
  "status": "started | succeeded | failed",
  "retry_count": 0,
  "duration_ms": 450,
  "trace_id": "uuid",
  "timestamp": "utc_iso8601"
}
```

---

### 3.14 Outbox Worker Governance (MANDATORY)

The Outbox Worker is a background job that reads pending events from `event_outbox` and delivers them to the event bus / subscribers.

```python
@shared_task(bind=True, name='outbox.deliver_events')
def deliver_outbox_events(self):
    """
    Runs every 5 seconds minimum.
    Reads pending events from event_outbox and publishes to event bus.
    Idempotent - uses PostgreSQL advisory locking.
    """
    with OutboxLock():
        pending = EventOutbox.objects.filter(
            status='pending',
            publish_attempts__lt=MAX_OUTBOX_ATTEMPTS,  # Default 5
        ).order_by('created_at')[:OUTBOX_BATCH_SIZE]    # Default 100 per run

        for event in pending:
            try:
                EventBus.publish_raw(event)
                event.status = 'published'
                event.published_at = now()
                event.save(update_fields=['status', 'published_at'])
            except Exception as e:
                event.publish_attempts += 1
                event.last_attempt_at = now()
                if event.publish_attempts >= MAX_OUTBOX_ATTEMPTS:
                    event.status = 'failed'
                    EventDeadLetter.objects.create(
                        event_id=event.event_id,
                        event_type=event.event_type,
                        business_unit_id=event.business_unit_id,
                        correlation_id=event.correlation_id,
                        payload=event.payload,
                        failure_reason=str(e),
                        retry_count=event.publish_attempts,
                    )
                    monitoring.alert(f"Outbox event moved to dead-letter: {event.event_type}")
                event.save(update_fields=['publish_attempts', 'last_attempt_at', 'status'])
```

Outbox Worker MUST:
- Run every 5 seconds minimum
- Use advisory locking (`pg_try_advisory_lock`) to prevent concurrent delivery
- Alert monitoring when events reach dead-letter
- Purge published events older than 3 months (separate cleanup job)

### 3.15 Event Bus Worker Standards (MANDATORY)

Each event type MUST have at least one registered consumer. Consumer workers MUST be idempotent using the `processed_event` deduplication table (E01 §4.6).

Retry policy for event consumers (exponential backoff):

| Retry | Delay |
|-------|-------|
| 1st | 60 seconds |
| 2nd | 120 seconds |
| 3rd | 240 seconds |
| 4th | 480 seconds |
| 5th (final) | 960 seconds → Dead-letter |

After exhausting all retries: event MUST go to `event_dead_letter` table, monitoring MUST be alerted immediately, on-call engineer MUST review within 24 hours.

Cache key additions for module governance:
```text
module_access:{business_unit_id}:{module_code}     TTL: 300s
feature:{business_unit_id}:{feature_code}           TTL: 300s
subscription_plan:{business_unit_id}                TTL: 300s

Invalidate on:
- Module subscription change → invalidate module_access:{business_unit_id}:*
- Feature flag override change → invalidate feature:{business_unit_id}:*
- Subscription plan change → invalidate subscription_plan:{business_unit_id}
```


## 4. SECURITY & COMPLIANCE

- Background tasks MUST respect RBAC (B07) and tenant isolation (B02)
- Unauthorized task execution is PROHIBITED
- Cached data MUST NOT expose sensitive information
- Cache exposure of PII or tokens is PROHIBITED

---

## 5. NON-NEGOTIABLE RULES

- Blocking heavy operations in request lifecycle = PROHIBITED
- Non-idempotent tasks = PROHIBITED
- Cache exception crashing application = PROHIBITED (HIGH)
- Unscoped cache key for tenant data = CRITICAL violation
- Sensitive data cached = PROHIBITED
- Background job without tenant context for tenant data = CRITICAL violation
- Infinite retries = PROHIBITED
- Outbox worker not running = PROHIBITED
- Event consumer without idempotency check = PROHIBITED
- Dead-letter events without monitoring alert = PROHIBITED
- Task without timeout = PROHIBITED
- Magic number TTLs = PROHIBITED (use named constants)

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Async tasks MUST be tested
- Retry logic MUST be tested
- Cache behavior MUST be tested (including fail-silently behavior)
- Cache scope MUST be tested (no cross-tenant leakage)
- Cache invalidation MUST be tested after writes
- Performance benchmarks MUST be validated
- Slow query detection MUST be verified
- Task tenant-context preservation MUST be tested
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Heavy work MUST be async (Celery + Redis)
- Cache MUST be safe, scoped, and fail-silently
- Cache TTLs MUST be named constants
- Slow queries MUST be detected (200ms WARNING / 500ms CRITICAL)
- Background jobs MUST carry `business_unit_id` for tenant-owned operations
- Cache keys MUST include tenant scope

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
