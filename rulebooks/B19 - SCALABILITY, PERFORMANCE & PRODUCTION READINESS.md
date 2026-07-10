<!-- yss_orbit\rulebooks\B19 - SCALABILITY, PERFORMANCE & PRODUCTION READINESS.md -->
# B19 - SCALABILITY, PERFORMANCE & PRODUCTION READINESS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B08 (Database), B10 (Queries), B13 (Async & Caching), B18 (Deployment)
**Governance Role:** Scalability & Production Readiness Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Horizontal scaling readiness, stateless service design, read replica governance, distributed worker standards, queue scaling, multi-region readiness, performance baseline requirements, connection pooling, graceful shutdown, load balancer health checks |
| REFERENCES | B08 (DB partitioning, indexes), B10 (slow query enforcement), B13 (async/cache), B15 (observability), B18 (deployment) |
| MUST NOT DUPLICATE | Slow query standards (B10), cache TTL (B13), deployment gating (B18) |

---

## 1. PURPOSE

This rulebook defines **scalability and production readiness standards** for YSS Orbit.

It establishes:
- Horizontal scaling readiness
- Performance baseline requirements
- Production operational standards
- Capacity management

All systems MUST be designed for scalability from inception.

---

## 2. SCOPE

Applies to: all backend services, all API endpoints, all database configurations, all caching systems, all background job workers. No production component is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Stateless Service Design (MANDATORY)

- All application services MUST be stateless
- No server-side user state MUST be stored in application memory between requests
- User session data MUST be stored in Redis or equivalent distributed store - NEVER in application memory
- File uploads MUST NOT be stored locally - cloud storage REQUIRED (see B11)
- Stateful application servers prevent horizontal scaling and are PROHIBITED

WHY: Stateful servers cannot be horizontally scaled. A user would fail if load-balanced to a different instance.

### 3.2 Horizontal Scaling Readiness (MANDATORY)

- All services MUST support multiple simultaneous instances
- Services MUST NOT use server-local locks for distributed operations
- Distributed locking MUST use Redis or equivalent shared store
- Configuration MUST be external (environment variables) - not baked into each instance

### 3.3 Database Connection Pooling (MANDATORY)

- Database connections MUST use connection pooling (e.g., PgBouncer or Django connection pooling)
- Unlimited database connections are PROHIBITED
- Connection pool size MUST be configured based on worker count and database capacity
- Connection leaks MUST be detected and prevented

### 3.4 Read Replica Usage (MANDATORY)

- Read-heavy queries (analytics, reports, dashboards, list views) MUST use read replicas where available
- Write operations MUST use the primary database
- Database routing MUST correctly separate reads and writes
- Reading from primary for non-critical reads MUST be avoided in high-load environments

### 3.5 Queue Scaling (MANDATORY)

- Task queues MUST be scalable (additional workers deployable independently)
- Worker count MUST be configurable per environment without code changes
- Queue depth MUST be monitored - alerts MUST fire if queue depth exceeds threshold
- Priority queues MUST be used for time-sensitive vs background operations

### 3.6 Caching for Performance (MANDATORY)

- All high-frequency, low-change data MUST be cached per B13 standards
- Cache warming strategies MUST be implemented for critical data (permissions, menu items, reference data)
- Cache failure MUST degrade gracefully - never crash the system (B13 §3.8)

### 3.7 API Performance Baselines (MANDATORY)

| Endpoint Type | Target P95 Response Time |
|--------------|------------------------|
| Standard list/detail API | < 200ms |
| Filtered/sorted list API | < 300ms |
| Dashboard summary API | < 500ms |
| Report generation API | Async (return job ID immediately) |
| File upload API | < 2 seconds for server acknowledgment |

Endpoints consistently exceeding baseline MUST be optimized before next release.

### 3.8 Pagination Enforcement (MANDATORY)

- All list endpoints MUST be paginated (per B01 §5.3)
- Unbounded queries are PROHIBITED
- Default page size MUST be defined
- Maximum page size MUST be enforced

### 3.9 Health Check Endpoints (MANDATORY)

- `/health/` endpoint MUST return system health status
- `/health/ready/` endpoint MUST verify DB, Redis, and queue connectivity
- `/health/live/` endpoint MUST verify application process is alive
- Load balancers MUST use these endpoints for routing decisions

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "queue": "connected",
  "timestamp": "utc_iso8601"
}
```

### 3.10 Graceful Shutdown (MANDATORY)

- Services MUST handle SIGTERM signals gracefully
- In-progress requests MUST complete before shutdown
- Background jobs MUST NOT be abruptly killed - jobs MUST complete or be re-queued safely
- Graceful shutdown timeout MUST be configured (30 seconds recommended)

### 3.11 Observability for Scalability (MANDATORY)

- Metrics MUST be collected for: request throughput, error rate, latency percentiles (P50, P95, P99), queue depth, cache hit rate, DB connection pool utilization
- Auto-scaling decisions MUST be driven by monitored metrics - not manual estimates
- Dashboards MUST be configured before production launch of any new high-traffic feature

### 3.12 Multi-Region Readiness (MANDATORY)

- Architecture MUST NOT assume single-region operation
- Static assets MUST be served via CDN
- Data residency requirements MUST be documented per tenant where applicable
- Session storage (Redis) MUST be either region-local or replicated
- Cross-region consistency strategy MUST be documented before multi-region deployment

### 3.13 Capacity Planning (MANDATORY)

- Capacity planning MUST occur before large tenant onboarding
- Database schema MUST be designed with partition-readiness for tables > 100M rows
- Large-volume tables MUST be reviewed for index efficiency periodically
- Capacity reviews MUST be scheduled quarterly for production systems

---

### 4.11 Table Partition Readiness (MANDATORY)

All high-volume tables MUST be created as partitioned tables from inception. Retrofitting partitioning onto existing non-partitioned tables is expensive and risky. Design for partitioning upfront.

Tables that MUST be partitioned (RANGE by time):

| Table | Partition Key | Granularity | Retention Policy |
|-------|--------------|-------------|-----------------|
| `attendance_logs` | `date` | Monthly | 2 years active; archive older |
| `audit_log` | `created_at` | Monthly | 5 years active; archive older; 7-year legal retention |
| `event_outbox` | `created_at` | Monthly | 3 months (published rows purged weekly) |
| `processed_event` | `processed_at` | Monthly | 6 months |
| `payroll_runs` | `created_at` | Yearly | 7 years (statutory) |
| `pos_bills` | `created_at` | Monthly | 3 years active |
| `stock_transactions` | `created_at` | Monthly | 2 years active |
| `notifications` | `created_at` | Monthly | 1 year active |

Partition creation MUST be automated: a management command (`create_next_month_partitions`) MUST run on the first day of each month via Celery Beat to create next month's partitions. Alerts MUST fire if partition creation fails.

Read replica routing MUST be applied to partitioned tables: reporting queries, exports, audit queries → read replica; operational writes, real-time reads → primary.

### 4.12 Event Bus Scalability Standards (MANDATORY)

Outbox Worker Scaling:
- Multiple outbox workers are safe with advisory locking
- Each worker MUST use `pg_try_advisory_xact_lock` per batch
- Recommended: 2–4 outbox workers per production instance
- Alert if outbox pending count > 100 for more than 5 minutes (E03 §3.7)

Event Consumer Scaling:
- Celery workers consuming events MUST be horizontally scalable
- Each consumer task MUST be idempotent (E01 §4.6)
- Queue depth monitoring MUST be configured (alert if queue depth > 500)
- Separate Celery queues per module: `queue_payroll`, `queue_inventory`, `queue_hrms` to prevent one module's heavy load from starving others

Event Retention:
- Published outbox events MUST be purged after 3 months
- Processed event deduplication records MUST be purged after 6 months
- Dead-letter events MUST be retained until acknowledged

### 4.13 Module Subscription Cache Warming (MANDATORY)

Module subscription and feature flag cache MUST be warmed on:
- Application startup (warm top 100 most-accessed BusinessUnits)
- User login (warm the specific BusinessUnit the user selects)
- Subscription change (invalidate and re-warm affected BusinessUnit)

Cache warming failure MUST NOT block application startup - fall through to DB queries.

### 4.14 SLO Alignment with E03 (MANDATORY)

All performance optimizations MUST target the SLOs defined in E03 §3.5:

| Target | Threshold | Action if breached |
|--------|-----------|-------------------|
| API P95 latency | < 200ms | Investigate query plan + caching |
| Background job success | 99.5% | Dead-letter review + retry strategy review |
| Outbox delivery | 99.9% | Scale outbox workers; check broker health |
| Cache hit rate | > 70% | Review TTLs; warm more aggressively |
| DB connection pool | < 80% utilization | Scale connection pool or add read replica |

Query performance mandates:
- No query without a covering index for `business_unit_id` + primary filter column
- No sequential scan on any table > 10,000 rows in production
- EXPLAIN ANALYZE required for all new queries before deployment
- Slow query threshold: 500ms → logged; 1000ms → alert


## 4. SECURITY & COMPLIANCE

- Scaling operations MUST NOT bypass security controls
- Distributed locking MUST be tenant-safe
- Horizontal scaling MUST preserve RBAC and tenant isolation

---

## 5. NON-NEGOTIABLE RULES

- Stateful application servers = PROHIBITED
- Server-local session storage = PROHIBITED
- Unbounded queries in production = PROHIBITED
- Missing health check endpoints = PROHIBITED
- Missing graceful shutdown = HIGH violation
- Missing connection pooling = PROHIBITED
- Hardcoded scaling limits = PROHIBITED
- High-volume tables not partitioned from inception = PROHIBITED
- Missing outbox worker scalability configuration = PROHIBITED
- Missing separate Celery queues per module = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Load tests MUST be executed before major launches
- Health check endpoints MUST be tested
- Graceful shutdown MUST be tested
- Cache fallback behavior MUST be tested
- Read replica routing MUST be tested
- Stateless behavior MUST be verified (multiple instance test)
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Services MUST be stateless (horizontal scaling ready)
- Connection pooling REQUIRED
- Read replicas for analytics and reports
- Health check endpoints REQUIRED
- Graceful shutdown REQUIRED
- Performance baselines REQUIRED and monitored

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
