<!-- yss_orbit\rulebooks\E03 - OBSERVABILITY, DISTRIBUTED TRACING & CORRELATION ID STANDARDS.md -->
# E03 - OBSERVABILITY, DISTRIBUTED TRACING & CORRELATION ID STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW  
**Depends On:** B01 (observability §5.27), B15 (logging implementation), E01 (domain events), E02 (orchestrators)  
**Governance Role:** Observability & Tracing Authority  

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | correlation_id standard, distributed tracing propagation, APM tool standards, SLO/SLA definitions, structured logging enrichment, metric standards, alerting thresholds, health check standards |
| REFERENCES | B01 (trace_id law §5.27), B15 (audit implementation), B13 (async - task logging), E01 (event correlation), E02 (orchestrator tracing) |
| MUST NOT DUPLICATE | Audit log format (B15), async task rules (B13), monitoring alerting (B15 §4.10) |

---

## 1. PURPOSE

This rulebook defines the **observability, distributed tracing, and correlation ID standards** for YSS Orbit.

A system that cannot be observed cannot be debugged in production. This rulebook ensures that every action - from API request to background job to domain event to database query - is traceable through a single `correlation_id`.

---

## 2. CORRELATION ID vs TRACE ID - THE CRITICAL DISTINCTION

**WHAT:**

| Field | Scope | Generated | Propagated Through |
|-------|-------|-----------|-------------------|
| `correlation_id` | Business operation | API gateway on request arrival - one per user action | API → Service → Repository → Background Jobs → Domain Events → Audit Logs |
| `trace_id` | Technical request span | APM tool (OpenTelemetry) | HTTP spans, DB spans, cache spans - automatically |
| `request_id` | Single HTTP request | Per HTTP request (subset of a correlation) | Within one API call only |

**WHY this distinction matters:** When a payroll orchestrator runs 5 steps across 3 modules, triggering 2 background jobs and 3 domain events, ALL of that must be traceable by a single `correlation_id`. A `trace_id` only covers a single HTTP span. Using only `trace_id` leaves the async portion untraceable.

**Enterprise Risk if confused:** Production incidents become un-debuggable. You can find the API request but cannot trace what the background jobs did. This means hours of manual log searching per incident.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 correlation_id Generation & Propagation (MANDATORY)

**WHAT:** Every external request MUST generate a `correlation_id` at the API gateway. This ID MUST propagate to every system touched by that request.

**HOW:**

```python
# Django middleware - generated at request entry:
class CorrelationIdMiddleware:
    def __call__(self, request, *args, **kwargs):
        correlation_id = request.headers.get('X-Correlation-Id') or str(uuid4())
        request.correlation_id = correlation_id
        response = self.get_response(request)
        response['X-Correlation-Id'] = correlation_id  # Return to client
        return response
```

**Propagation chain (MANDATORY):**
```
Incoming Request
  → correlation_id generated in middleware
  → SecurityContext.correlation_id = correlation_id
  → Service Layer receives via SecurityContext
  → Repository Layer: all log entries include correlation_id
  → Background Jobs: correlation_id in task payload
  → Domain Events: correlation_id in event struct (see E01)
  → Audit Logs: correlation_id field (see B15)
  → All structured log entries: correlation_id field
```

**Background job propagation (MANDATORY):**
```python
@shared_task(bind=True)
def process_payroll_run(self, payroll_run_id: str, business_unit_id: str, correlation_id: str):
    # correlation_id received from orchestrator - propagated to all sub-operations
    ctx = SystemSecurityContext(
        business_unit_id=UUID(business_unit_id),
        correlation_id=UUID(correlation_id),
    )
    payroll_service.process(payroll_run_id, ctx)
```

### 3.2 Structured Log Enrichment (MANDATORY)

Every structured log entry MUST include these standard fields:

```json
{
  "timestamp": "2025-06-15T10:30:00.000Z",
  "level": "INFO",
  "service": "yss-orbit-api",
  "module": "payroll",
  "correlation_id": "uuid",
  "trace_id": "opentelemetry-trace-id",
  "user_id": "uuid",
  "business_unit_id": "uuid",
  "endpoint": "/api/v1/payroll/runs/",
  "method": "POST",
  "duration_ms": 145,
  "message": "Payroll run initiated"
}
```

**Rules:**
- `correlation_id` MUST appear on EVERY log entry - no exceptions
- `business_unit_id` MUST appear where applicable (all tenant-scoped operations)
- `user_id` MUST appear (UUID only - no PII per B09)
- Unstructured log lines (plain text without JSON fields) are PROHIBITED

### 3.3 Distributed Tracing (MANDATORY)

**WHAT:** OpenTelemetry-compatible distributed tracing MUST be implemented for all API endpoints, service calls, repository queries, and background jobs.

**Required instrumentation:**
- HTTP requests: automatic via OpenTelemetry Django middleware
- Database queries: automatic via OpenTelemetry SQLAlchemy/Django instrumentation
- Redis calls: automatic via OpenTelemetry Redis instrumentation
- Background jobs (Celery): via OpenTelemetry Celery instrumentation
- Cross-service calls: manual span creation where auto-instrumentation is insufficient

```python
from opentelemetry import trace

tracer = trace.get_tracer("yss-orbit.payroll")

def compute_payroll_deductions(employee_id: UUID, ctx: SecurityContext):
    with tracer.start_as_current_span("compute_payroll_deductions") as span:
        span.set_attribute("employee.id", str(employee_id))
        span.set_attribute("business_unit.id", str(ctx.selected_business_unit_id))
        span.set_attribute("correlation.id", str(ctx.correlation_id))
        # ... computation
```

### 3.4 APM Tool Standards (MANDATORY)

| Environment | Recommended Tools |
|------------|------------------|
| Production | Datadog APM, Grafana + Tempo, or Elastic APM |
| Staging | Same as production |
| Development | Jaeger (local) or console exporter |

All APM tools MUST:
- Receive correlation_id as a custom attribute
- Enable correlation_id search/filter
- Support tenant filtering by business_unit_id
- Retain traces for minimum 30 days

### 3.5 SLO/SLA Definitions (MANDATORY)

| Metric | SLO Target | SLA Breach Threshold | Action |
|--------|-----------|---------------------|--------|
| API availability | 99.9% | < 99.5% in 1 hour | PagerDuty alert |
| API P95 latency (standard) | < 200ms | > 500ms sustained | Alert + investigation |
| API P95 latency (reports) | Async (job) | > 2s for job initiation | Alert |
| Background job success rate | 99.5% | < 99% in 30 min | Alert + dead-letter review |
| Event delivery rate (outbox) | 99.9% | < 99.5% | Alert |
| Cache hit rate | > 70% | < 50% sustained | Alert |
| Error rate (5xx) | < 0.1% | > 1% in 5 min | PagerDuty alert |

### 3.6 Health Check Standards (MANDATORY)

Three health check endpoints MUST exist and be kept current:

```python
# GET /health/          → Basic liveness (is the process alive?)
# GET /health/ready/    → Readiness (can it serve traffic?)
# GET /health/details/  → Full dependency status (authenticated ops only)

# /health/ready/ response:
{
    "status": "ready",  # or "degraded" or "not_ready"
    "database": "connected",
    "redis": "connected",
    "celery_workers": "2 active",
    "event_outbox_pending": 3,  # Alert if > 100
    "timestamp": "2025-06-15T10:30:00Z"
}
```

**Rules:**
- Load balancers MUST use `/health/ready/` - never `/health/`
- `/health/details/` MUST require authentication
- A degraded dependency MUST return `"degraded"` (not `"healthy"`)
- Pending outbox events > 100 MUST downgrade to `"degraded"`

### 3.7 Alerting Standards (MANDATORY)

All alerts MUST include `correlation_id` and `business_unit_id` in the alert context where available:

| Alert | Trigger | Severity | Response |
|-------|---------|----------|----------|
| High 5xx rate | > 1% 5xx over 5 min | P1 | PagerDuty |
| API latency breach | P95 > 500ms over 5 min | P2 | Slack |
| Background job failure | Job fails after all retries | P2 | Slack |
| Dead-letter queue growth | > 10 events in dead-letter | P2 | Slack |
| Outbox backlog | > 100 pending outbox events | P2 | Slack |
| Cache hit rate drop | < 50% over 10 min | P3 | Slack |
| Security event | Cross-tenant access attempt | P1 | PagerDuty |
| Slow query | Query > 500ms | P3 | Slack |

### 3.8 Correlation ID Debug Flow (MANDATORY)

When debugging a production incident, the `correlation_id` enables this flow:

```
1. User reports: "Payroll for Reliance Vizag failed at 10:30"
2. Engineer searches APM: correlation_id from failed API request
3. APM shows: API → PayrollOrchestrator step 3 (PayslipService) failed
4. Structured logs: correlation_id → exact error in PayslipService
5. Audit log: correlation_id → what state was the system in?
6. Background jobs: correlation_id → which jobs were triggered?
7. Domain events: correlation_id → which events were published/failed?
```

Without `correlation_id`, step 3-7 are impossible - engineer must manually correlate logs by timestamp (hours of work per incident).

---

## 4. NON-NEGOTIABLE RULES

- Log entry without `correlation_id` = PROHIBITED
- correlation_id not propagated to background job = CRITICAL violation
- correlation_id not propagated to domain event = CRITICAL violation
- Unstructured log lines = PROHIBITED
- Missing health check endpoints = PROHIBITED
- APM tool not configured in production = PROHIBITED
- SLO breach with no monitoring alert = CRITICAL operational gap
- Dead-letter events not alerting = PROHIBITED

---

## 5. QUICK SUMMARY

- `correlation_id` ties one user action through API → Service → Jobs → Events → Audit
- Generated at middleware, carried in SecurityContext, propagated everywhere
- Every log entry MUST include correlation_id and business_unit_id
- OpenTelemetry for distributed tracing
- SLOs defined and monitored - alerts fire when breached
- Health checks at three levels: liveness, readiness, full details

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
