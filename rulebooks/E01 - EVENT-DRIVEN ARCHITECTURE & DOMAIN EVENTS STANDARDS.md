<!-- yss_orbit\rulebooks\E01 - EVENT-DRIVEN ARCHITECTURE & DOMAIN EVENTS STANDARDS.md -->
# E01 - EVENT-DRIVEN ARCHITECTURE & DOMAIN EVENTS STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW  
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B04 (Application Architecture), B05 (Module Isolation)  
**Governance Role:** Event-Driven Architecture Authority  

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Domain event definition standards, event bus governance, outbox pattern enforcement, event versioning, event contract standards, cross-module async communication rules, event payload standards, event consumer rules |
| REFERENCES | B01 (background jobs §5.29, idempotency §5.28), B02 (tenant isolation - applies to events), B04 (service layer - events published here), B05 (cross-module boundary - events cross it), B08 (outbox table schema), B13 (async processing), B15 (audit logging for events) |
| MUST NOT DUPLICATE | Async task rules (B13), tenant isolation mechanics (B02), audit log format (B15), orchestration patterns (E02) |

---

## 1. PURPOSE

This rulebook defines the **event-driven architecture standards** for YSS Orbit.

It establishes:
- Domain event definition and structure
- Event bus governance
- Outbox pattern as the mandatory publishing mechanism
- Event versioning and contract management
- Inter-module async communication rules
- Tenant isolation within event flows

All cross-module async communication MUST use domain events following these standards.

---

## 2. WHY EVENT-DRIVEN ARCHITECTURE

**What:** Modules communicate by publishing and subscribing to typed, versioned domain events instead of calling each other directly.

**Why:** Direct service-to-service calls across modules create tight coupling, cascade failures, and impossible-to-trace dependency chains. Events allow modules to evolve independently, scale separately, and fail without bringing others down.

**How:** A module completes a business operation → publishes a domain event to the outbox → a worker reads the outbox and delivers to subscribers → subscribers process independently.

**Example:**
```
Attendance finalized
  → attendance.finalized event published
  → Payroll module subscribes → computes deductions
  → Notification module subscribes → alerts HR
  → Each runs independently, fails independently
```

**Bad practice (PROHIBITED):**
```
AttendanceService directly calls PayrollService.recomputeDeductions()
PayrollService directly calls NotificationService.sendAlert()
```
This creates a chain where Payroll failure blocks Attendance completion.

**Enterprise Risk if violated:** Cascade failures across modules, untraceable bugs, impossible independent scaling, brittle system that breaks when any module has a problem.

---

## 3. CANONICAL TERMINOLOGY

| Term | Definition |
|------|-----------|
| **Domain Event** | An immutable record that something significant happened in the domain. Carries what happened, when, and all context needed for subscribers |
| **Event Bus** | The messaging infrastructure (Redis Streams / Celery / internal queue) that routes events from publishers to subscribers |
| **Event Publisher** | The module (via Service Layer) that creates and publishes events after completing a business operation |
| **Event Consumer / Subscriber** | A module that processes events it has subscribed to |
| **Outbox Pattern** | Writing the event to an `outbox` table in the SAME database transaction as the business operation, then a background worker reliably delivers it to the event bus |
| **Event Versioning** | The practice of including a version field in every event so consumers can handle multiple versions |
| **Idempotent Consumer** | An event consumer that can safely receive the same event multiple times without duplicate side effects |

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Cross-Module Communication Rule (MANDATORY)

**WHAT:** Modules MUST NOT call each other's internal services directly for async cross-domain operations.

**WHY:** Direct calls create tight coupling. If Payroll calls Attendance directly, Payroll breaks when Attendance is unavailable. Events decouple them - Attendance publishes, Payroll subscribes when ready.

**HOW:**
```python
# PROHIBITED - direct cross-module service call for async operation:
from apps.payroll.services import PayrollService
PayrollService.recompute_for_attendance(employee_id, ctx)

# REQUIRED - publish a domain event:
from apps.common.events import EventBus
EventBus.publish(AttendanceFinalizedEvent(
    business_unit_id=ctx.selected_business_unit_id,
    employee_id=employee_id,
    period=period,
    total_days=total_days,
    absent_days=absent_days,
))
```

**Exception:** Modules MAY call each other's PUBLIC service interfaces for synchronous data reads where a response is needed immediately in the same request cycle. Async cross-domain OPERATIONS always use events.

### 4.2 Domain Event Structure (MANDATORY)

Every domain event MUST carry these fields. No exceptions.

```python
@dataclass(frozen=True)
class DomainEvent:
    event_id: UUID           # Unique identifier for this event instance
    event_type: str          # 'attendance.finalized' - dot.separated.lowercase
    event_version: str       # '1.0' - semantic version of the event contract
    business_unit_id: UUID   # Tenant isolation - MANDATORY for tenant-owned events
    organization_id: UUID    # Organization scope
    aggregate_id: UUID       # ID of the root entity this event is about
    aggregate_type: str      # 'AttendanceRecord', 'Employee', 'PayrollRun'
    correlation_id: UUID     # Ties to originating request - propagated from SecurityContext
    occurred_at: datetime    # UTC timestamp when the event occurred (NOT when published)
    published_at: datetime   # UTC timestamp when published (set by outbox worker)
    payload: dict            # Event-specific data (see §4.4 for payload rules)
```

**WHY:** Every field is required for a reason. `business_unit_id` enforces tenant isolation. `correlation_id` enables full-stack tracing. `event_version` allows contract evolution. `aggregate_id` + `aggregate_type` enable entity linkage.

### 4.3 Outbox Pattern - Mandatory Publishing Mechanism (MANDATORY)

**WHAT:** Domain events MUST be written to the `outbox` table in the SAME database transaction as the business operation. A background worker reads the outbox and publishes to the event bus.

**WHY:** Without the outbox pattern, a race condition exists where the business operation succeeds but the event is never published (if the system crashes between `db.save()` and `event_bus.publish()`). The outbox eliminates this by making event publishing part of the same atomic transaction.

**BAD PRACTICE:**
```python
# PROHIBITED - event published OUTSIDE transaction:
def finalize_attendance(employee_id, ctx):
    repo.mark_finalized(employee_id, ctx)
    event_bus.publish(AttendanceFinalizedEvent(...))  # Loses event if system crashes here
```

**CORRECT PATTERN:**
```python
# REQUIRED - outbox within the same transaction:
def finalize_attendance(employee_id, ctx):
    with transaction.atomic():
        repo.mark_finalized(employee_id, ctx)
        outbox_repo.enqueue(AttendanceFinalizedEvent(...))  # Same transaction
    # Worker picks up from outbox and publishes to event bus
```

**Outbox Table Schema (defined in B08):**
```sql
CREATE TABLE event_outbox (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id         UUID NOT NULL UNIQUE,
    event_type       VARCHAR(200) NOT NULL,
    event_version    VARCHAR(20) NOT NULL DEFAULT '1.0',
    business_unit_id UUID,
    aggregate_id     UUID NOT NULL,
    aggregate_type   VARCHAR(100) NOT NULL,
    correlation_id   UUID NOT NULL,
    payload          JSONB NOT NULL,
    occurred_at      TIMESTAMPTZ NOT NULL,
    published_at     TIMESTAMPTZ,           -- NULL = not yet published
    publish_attempts INTEGER DEFAULT 0,
    last_attempt_at  TIMESTAMPTZ,
    status           VARCHAR(20) DEFAULT 'pending',  -- pending / published / failed
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_outbox_pending ON event_outbox(status, created_at) WHERE status = 'pending';
```

### 4.4 Event Payload Standards (MANDATORY)

**WHAT:** Event payloads carry the data consumers need to act.

**Rules:**
- Payloads MUST include all data a subscriber needs - subscribers MUST NOT query the publisher's database
- Payloads MUST NOT include RESTRICTED data per C02 (no raw PII, no tokens)
- Payloads MUST NOT expose another module's internal model structure
- Payloads MUST be serializable to JSON
- Payloads MUST be backward-compatible within the same version

```python
# GOOD payload - includes all needed context:
AttendanceFinalizedEvent.payload = {
    "employee_id": "uuid",
    "period_month": 6,
    "period_year": 2025,
    "total_working_days": 26,
    "present_days": 24,
    "absent_days": 2,
    "late_days": 1,
    "department_id": "uuid"
}

# BAD payload - forces subscriber to query publisher:
AttendanceFinalizedEvent.payload = {
    "employee_id": "uuid",
    "period": "2025-06"
    # Consumer would need to call Attendance API to get actual data - PROHIBITED
}
```

### 4.5 Event Versioning (MANDATORY)

**WHAT:** Events MUST carry a semantic version. When the event contract changes in a breaking way, the version MUST be incremented.

**WHY:** Subscribers may be on different versions. Without versioning, a contract change breaks all consumers simultaneously.

```python
# Version naming: MAJOR.MINOR
# MINOR: backward-compatible additions (new optional fields)
# MAJOR: breaking changes (removed fields, type changes)

# event_version = '1.0' → initial
# event_version = '1.1' → added optional field 'overtime_hours'
# event_version = '2.0' → breaking change to payload structure
```

**Consumer MUST handle multiple versions:**
```python
def handle_attendance_finalized(event: DomainEvent):
    if event.event_version.startswith('1.'):
        handle_v1(event)
    elif event.event_version.startswith('2.'):
        handle_v2(event)
    else:
        logger.warning(f"Unknown event version: {event.event_version}")
```

**Old event versions MUST NOT be removed until all consumers have migrated.**

### 4.6 Idempotent Consumer (MANDATORY)

**WHAT:** Every event consumer MUST be idempotent - processing the same event twice MUST NOT cause duplicate side effects.

**WHY:** The event bus guarantees at-least-once delivery. Network retries mean consumers WILL receive duplicate events. Without idempotency, duplicate payroll calculations, duplicate notifications, or duplicate stock adjustments will occur.

**HOW - store processed event_ids:**
```python
def handle_attendance_finalized(event: DomainEvent):
    # Check if already processed:
    if ProcessedEvent.objects.filter(event_id=event.event_id).exists():
        logger.info(f"Event {event.event_id} already processed - skipping")
        return

    with transaction.atomic():
        # Process the event
        payroll_service.compute_deductions(event.payload, event.business_unit_id)
        # Record as processed
        ProcessedEvent.objects.create(event_id=event.event_id)
```

### 4.7 Tenant Isolation in Events (MANDATORY)

- Every event for tenant-owned operations MUST include `business_unit_id`
- Event consumers MUST enforce tenant scope - receiving an event does NOT bypass tenant isolation
- Consumers MUST NOT process events for BusinessUnits they are not authorized to access
- Events MUST NOT cross tenant boundaries without explicit RBAC-approved authorization

```python
# REQUIRED - consumer enforces tenant scope:
def handle_low_stock_alert(event: DomainEvent):
    business_unit_id = event.business_unit_id
    if business_unit_id is None:
        raise ValueError("Missing business_unit_id in event - reject")
    notification_service.send_alert(business_unit_id=business_unit_id, payload=event.payload)
```

### 4.8 Standard Domain Events Catalogue (MANDATORY)

All domain events MUST use codes from this catalogue. Custom event types MUST be registered via Architecture Review.

| Event Type | Aggregate | Module | Trigger |
|-----------|-----------|--------|---------|
| `employee.created` | Employee | HRMS | New employee onboarded |
| `employee.updated` | Employee | HRMS | Employee record changed |
| `employee.terminated` | Employee | HRMS | Employee exits |
| `attendance.finalized` | AttendanceRecord | Attendance | Month attendance locked |
| `leave.approved` | LeaveRequest | Leave | Leave application approved |
| `leave.rejected` | LeaveRequest | Leave | Leave application rejected |
| `payroll.generated` | PayrollRun | Payroll | Payroll run completed |
| `payroll.approved` | PayrollRun | Payroll | Payroll approved |
| `invoice.created` | Invoice | Billing | Invoice generated |
| `invoice.paid` | Invoice | Billing | Payment received |
| `inventory.low_stock` | StockItem | Inventory | Stock below threshold |
| `inventory.expiry_alert` | StockBatch | Inventory | Batch nearing expiry |
| `pos.bill_created` | POSBill | POS | Sale completed |
| `module.activated` | ModuleSubscription | Platform | Tenant activated module |
| `subscription.expired` | Subscription | Platform | Plan expired |
| `subscription.renewed` | Subscription | Platform | Plan renewed |
| `user.created` | User | Platform | New user registered |
| `role.changed` | UserBusinessUnit | Platform | User role updated |

### 4.9 Dead-Letter Handling (MANDATORY)

Events that fail to process after all retries MUST be moved to a dead-letter store.

```sql
CREATE TABLE event_dead_letter (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id         UUID NOT NULL,
    event_type       VARCHAR(200) NOT NULL,
    business_unit_id UUID,
    correlation_id   UUID,
    payload          JSONB NOT NULL,
    failure_reason   TEXT NOT NULL,
    failed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retry_count      INTEGER NOT NULL,
    acknowledged     BOOLEAN DEFAULT FALSE,
    acknowledged_by  UUID,
    acknowledged_at  TIMESTAMPTZ
);
```

- Dead-letter events MUST trigger a monitoring alert (E03)
- Dead-letter events MUST be reviewed within 24 hours
- Dead-letter events MUST NEVER be silently discarded

---

## 5. SECURITY & COMPLIANCE

- Tenant isolation MUST be enforced in every event payload AND every consumer
- Events MUST NOT carry RESTRICTED data (C02) - use opaque IDs
- All domain events MUST be audit-logged with `correlation_id`
- Cross-tenant event routing is PROHIBITED

---

## 6. NON-NEGOTIABLE RULES

- Direct cross-module service calls for async operations = PROHIBITED
- Publishing events outside database transaction (without outbox) = CRITICAL violation
- Non-idempotent event consumer = CRITICAL violation
- Event missing `business_unit_id` for tenant-owned operations = CRITICAL violation
- Event missing `correlation_id` = PROHIBITED
- Event missing `event_version` = PROHIBITED
- Dead-letter events silently discarded = PROHIBITED
- RESTRICTED data in event payload = CRITICAL compliance violation
- Unregistered event types in catalogue = PROHIBITED

---

## 7. TESTING REQUIREMENTS

- Event publication MUST be tested (event appears in outbox on business operation)
- Outbox worker delivery MUST be tested
- Consumer idempotency MUST be tested (same event processed twice → no duplicate effects)
- Tenant scope enforcement in consumers MUST be tested
- Dead-letter handling MUST be tested (simulate consumer failure exhaustion)
- Event versioning MUST be tested (v1.0 and v2.0 payloads both handled)
- correlation_id propagation MUST be tested end-to-end
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Cross-module async = domain events only. No direct calls.
- Events go through the outbox (same DB transaction as operation)
- Every event carries: event_id, event_type, event_version, business_unit_id, correlation_id
- Consumers MUST be idempotent
- Dead-letter events MUST be monitored and reviewed
- Tenant isolation applies inside event flows - always

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
