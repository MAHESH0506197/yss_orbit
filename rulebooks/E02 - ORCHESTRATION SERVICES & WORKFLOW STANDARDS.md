<!-- yss_orbit\rulebooks\E02 - ORCHESTRATION SERVICES & WORKFLOW STANDARDS.md -->
# E02 - ORCHESTRATION SERVICES & WORKFLOW STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW  
**Depends On:** B01, B04 (Application Architecture), B05 (Module Isolation), E01 (Domain Events)  
**Governance Role:** Orchestration & Workflow Authority  

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Orchestration service patterns, multi-step workflow governance, compensation pattern, saga design, orchestrator boundaries, step idempotency, orchestrator state persistence, workflow audit requirements |
| REFERENCES | B01 (transaction management §5.16, background jobs §5.29), B04 (service layer), E01 (domain events - published by orchestrators), B13 (async processing), B15 (audit logging) |
| MUST NOT DUPLICATE | Domain event standards (E01), service layer rules (B04), async task rules (B13) |

---

## 1. PURPOSE

This rulebook defines **orchestration service standards** for YSS Orbit.

Orchestration Services own complex, multi-step, cross-module workflows. They prevent the cascade-coupling problem of chained direct service calls while providing full traceability, retry safety, and compensation.

---

## 2. WHY ORCHESTRATION SERVICES

**What:** An Orchestration Service is a dedicated service that coordinates a multi-step business workflow, calling individual bounded context services in sequence, handling failures, and publishing the final domain event.

**Why:** Without orchestrators, complex workflows are implemented by having Service A call Service B, which calls Service C. This creates:
- Untraceable failures (which step failed?)
- No retry safety (step 3 failed - how do you retry without re-running steps 1 and 2?)
- No compensation (step 3 failed - how do you undo steps 1 and 2?)
- Tight coupling (changing step 2 breaks the chain)

**Example - WITHOUT orchestrator (PROHIBITED):**
```python
# AttendanceService calls PayrollService which calls NotificationService
def finalize_attendance(employee_id):
    mark_finalized(employee_id)                          # Step 1
    PayrollService.trigger_deduction_recompute(emp_id)  # Step 2 - DIRECT CALL
    NotificationService.send_payroll_alert(emp_id)      # Step 3 - DIRECT CALL
```

**Example - WITH orchestrator (REQUIRED):**
```python
class PayrollOrchestrator:
    def run(self, business_unit_id, period, ctx):
        # Step 1 - fetch attendance summary
        attendance = AttendanceService.get_summary(business_unit_id, period, ctx)
        # Step 2 - compute salary
        salary = SalaryService.compute(business_unit_id, attendance, ctx)
        # Step 3 - generate payslips
        payslips = PayslipService.generate(business_unit_id, salary, ctx)
        # Step 4 - publish domain event
        EventBus.publish(PayrollGeneratedEvent(business_unit_id=business_unit_id, payroll_run_id=salary.run_id))
        # Step 5 - trigger async email job
        email_job.delay(payroll_run_id=salary.run_id, business_unit_id=business_unit_id)
```

**Enterprise Risk if violated:** Untraceable production failures, impossible retry logic, impossible compensation, tight cross-module coupling that breaks when any step changes.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 When to Use an Orchestrator (MANDATORY)

**Use an Orchestrator when ALL of the following are true:**
1. The workflow touches MORE than one bounded context (module)
2. The workflow has MORE than 2 steps
3. Failure of any step requires a response (retry or compensation)
4. The workflow must be auditable end-to-end

**Do NOT use an Orchestrator for:**
- Single-module operations (use Service Layer directly)
- Simple two-step same-module operations
- Read-only cross-module queries (use public service interfaces)

### 3.2 Orchestrator Design Rules (MANDATORY)

**WHAT:**
- Orchestrators MUST live in the Service Layer - they are special Services
- Orchestrators MUST call each step via the public service interface of the target module
- Orchestrators MUST NOT access another module's repository or model directly
- Orchestrators MUST publish domain events on completion
- Each step in an orchestrator MUST be idempotent

```python
class EmployeeLifecycleOrchestrator:
    """
    Owns the employee onboarding workflow.
    Calls: HRMSService, PayrollService, AccessProvisioningService
    Publishes: employee.created event
    """

    def __init__(
        self,
        hrms_service: HRMSService,
        payroll_service: PayrollService,
        access_service: AccessProvisioningService,
        event_bus: EventBus,
        state_repo: OrchestratorStateRepository,
    ):
        self._hrms = hrms_service
        self._payroll = payroll_service
        self._access = access_service
        self._events = event_bus
        self._state = state_repo

    def onboard_employee(self, data: EmployeeOnboardDTO, ctx: SecurityContext) -> UUID:
        workflow_id = uuid4()
        try:
            # Step 1 - Create employee record in HRMS
            employee_id = self._hrms.create_employee(data, ctx)
            self._state.mark_step(workflow_id, 'HRMS_CREATED', employee_id)

            # Step 2 - Set up payroll component template
            self._payroll.provision_employee(employee_id, data.salary_grade, ctx)
            self._state.mark_step(workflow_id, 'PAYROLL_PROVISIONED')

            # Step 3 - Provision system access
            self._access.create_user_access(employee_id, data.role_id, ctx)
            self._state.mark_step(workflow_id, 'ACCESS_PROVISIONED')

            # Step 4 - Publish domain event (via outbox)
            self._events.publish(EmployeeCreatedEvent(
                business_unit_id=ctx.selected_business_unit_id,
                aggregate_id=employee_id,
                correlation_id=ctx.correlation_id,
                payload={"employee_id": str(employee_id), "name": data.full_name},
            ))
            self._state.mark_completed(workflow_id)
            return employee_id

        except Exception as e:
            self._state.mark_failed(workflow_id, str(e))
            self._compensate_onboarding(workflow_id, ctx)
            raise

    def _compensate_onboarding(self, workflow_id: UUID, ctx: SecurityContext) -> None:
        """Compensation: undo completed steps in reverse order."""
        state = self._state.get(workflow_id)
        if 'ACCESS_PROVISIONED' in state.completed_steps:
            self._access.revoke_user_access(state.employee_id, ctx)
        if 'PAYROLL_PROVISIONED' in state.completed_steps:
            self._payroll.deprovision_employee(state.employee_id, ctx)
        if 'HRMS_CREATED' in state.completed_steps:
            self._hrms.soft_delete_employee(state.employee_id, ctx)
```

### 3.3 Orchestrator State Persistence (MANDATORY)

**WHAT:** Long-running orchestrators MUST persist their workflow state to the database after each step.

**WHY:** If the application crashes mid-workflow, the state must be recoverable. Without persistence, the orchestrator cannot resume and cannot compensate.

```sql
CREATE TABLE orchestrator_state (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id      UUID NOT NULL UNIQUE,
    orchestrator     VARCHAR(100) NOT NULL,    -- 'EmployeeLifecycleOrchestrator'
    business_unit_id UUID NOT NULL,
    status           VARCHAR(20) NOT NULL,     -- 'running' / 'completed' / 'failed' / 'compensating'
    completed_steps  TEXT[] DEFAULT '{}',
    entity_id        UUID,                     -- Primary entity created/modified
    correlation_id   UUID NOT NULL,
    error_message    TEXT,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    created_by       UUID REFERENCES users(id)
);
```

### 3.4 Compensation Pattern (MANDATORY)

**WHAT:** When any step in a multi-step orchestrated workflow fails, the orchestrator MUST undo all previously completed steps in reverse order.

**WHY:** Without compensation, a failed workflow leaves the system in a partial state - employee created in HRMS but no payroll setup, or payroll set up but no system access. These partial states are impossible to detect and correct at scale.

**Rules:**
- Every step with side effects MUST have a corresponding compensation action
- Compensation MUST execute in reverse order of the original steps
- Compensation failures MUST be logged as CRITICAL and trigger a monitoring alert
- Compensation MUST be idempotent (safe to re-run)
- Compensation state MUST be persisted alongside workflow state

### 3.5 Platform Orchestrators (MANDATORY - All MUST be implemented)

| Orchestrator | Coordinates | Publishes |
|-------------|-------------|-----------|
| `PayrollOrchestrator` | Attendance summary → Leave deductions → Salary computation → Payslip generation → Email job | `payroll.generated` |
| `EmployeeLifecycleOrchestrator` | HRMS creation → Payroll provisioning → Access provisioning → Welcome notification | `employee.created` |
| `OffboardingOrchestrator` | Final payroll settlement → Access revocation → Leave clearance → Archive | `employee.terminated` |
| `InventoryTransferOrchestrator` | Source validation → Transfer request → Approval → Source deduction → Destination credit | `inventory.transferred` |
| `SubscriptionChangeOrchestrator` | Plan validation → Limit checks → Module enable/disable → Feature flag update → Notification | `subscription.changed` |
| `ProcurementOrchestrator` | Vendor validation → PO creation → Approval routing → GRN processing → Inventory credit → Payable entry | `purchase_order.completed` |

### 3.6 Orchestrator Audit Requirements (MANDATORY)

- Every orchestrator execution MUST create an audit log entry at start and completion
- Each step completion MUST be logged with the step name, entity ID, and timestamp
- Compensation actions MUST be audit-logged
- All orchestrator logs MUST carry `correlation_id` from the originating SecurityContext

### 3.7 Orchestrator Testing Requirements (MANDATORY)

- Happy path (all steps succeed) MUST be tested
- Each step failure (1 through N) MUST be tested - verify compensation runs correctly
- Step idempotency MUST be tested (run step twice - verify no duplicate effects)
- State persistence MUST be tested (simulate crash mid-workflow - verify state is recoverable)
- Compensation idempotency MUST be tested
- Tenant isolation MUST be tested (orchestrator for BU-A cannot touch BU-B data)

---

## 4. STANDARD ORCHESTRATION PATTERNS

### Pattern 1 - Sequential Steps with Compensation
Use for: onboarding, provisioning, complex mutations
```
step_1() → step_2() → step_3() → publish_event()
On failure at any step → compensate_n() → ... → compensate_1()
```

### Pattern 2 - Async Background Orchestration
Use for: payroll runs, bulk imports, report generation
```
API call → enqueue_orchestrator_job(workflow_id) → return job_id
Worker runs orchestrator asynchronously
Client polls /api/v1/jobs/{job_id}
```

### Pattern 3 - Event-Triggered Orchestration
Use for: workflows triggered by domain events from other modules
```
attendance.finalized event → PayrollOrchestrator.handle_attendance_event()
→ runs payroll for affected period
→ publishes payroll.generated
```

---

## 5. NON-NEGOTIABLE RULES

- Multi-step cross-module workflows WITHOUT an orchestrator = PROHIBITED
- Orchestrator steps NOT idempotent = CRITICAL violation
- Missing compensation for steps with side effects = CRITICAL violation
- Orchestrator state NOT persisted = CRITICAL violation
- Orchestrator accessing another module's internal repository = PROHIBITED
- Orchestrator NOT publishing domain event on completion = PROHIBITED
- Compensation NOT running in reverse order = PROHIBITED
- Missing audit log for orchestrator lifecycle = PROHIBITED

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
