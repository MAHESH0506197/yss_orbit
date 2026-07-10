<!-- yss_orbit\rulebooks\B27 - USER BUSINESS UNIT ASSIGNMENT LIFECYCLE.md -->
# B27 - USER BUSINESS UNIT ASSIGNMENT LIFECYCLE

**Version:** v1.0 ENTERPRISE DRAFT
**Status:** PROPOSED
**Depends On:** B02 (Multi-Tenant Architecture), B06 (Authentication), B07 (Authorization System)
**Governance Role:** Security & Identity Authority

---

## 1. PURPOSE

The `UserBusinessUnit` (UBU) junction is the most critical enforcement boundary in the platform. It controls Tenant Isolation, Authorization, and RBAC mapping. 
This rulebook defines the complete lifecycle for UBU assignments, addressing complex enterprise scenarios such as cross-BU management, temporary assignments, and domain-specific roles.

---

## 2. CORE ASSIGNMENT POLICIES

### 2.1 Cross-Business-Unit Managers
- **Policy:** A single `User` CAN possess multiple `UserBusinessUnit` records across different `BusinessUnit`s within the same `Organization`.
- **Enforcement:** Each UBU assignment is completely independent. A user can be a "Manager" in Hospital A, a "Viewer" in Hospital B, and have no access to Pharmacy C. 

### 2.2 Multiple Active Roles Policy (Option B Adopted)
- **Policy:** A `User` CAN have **multiple active roles** within the same `BusinessUnit`.
- **Enforcement:** The database `UniqueConstraint` for active assignments MUST be updated to `fields=["user", "business_unit", "role"]` (instead of just `user` + `business_unit`).
- **Permission Aggregation:** Permissions are strictly **UNION-based**. If Role A grants `read` and Role B grants `write`, the user has `read` + `write`. It is NEVER "Last Role Wins". This MUST be explicitly tested in RBAC logic.

### 2.3 Domain-Specific Roles
- **Policy:** Roles MUST NOT bleed across incompatible Business Domains.
- **Enforcement:** When creating/updating a UBU assignment, the system MUST validate that the `Role.business_domain_id` matches the `BusinessUnit.organization.business_domain_id`.
- **Example:** An "HR Manager" role (HRMS Domain) cannot be assigned to a "Retail Store" BU.

### 2.4 Temporary Assignments
- **Policy:** The system MUST support time-bound role assignments (e.g., temporary coverage, acting managers).
- **Enforcement:** The `UserBusinessUnitModel` MUST include:
  - `effective_from` (DateTimeField, nullable)
  - `effective_to` (DateTimeField, nullable)
- **Effective Date Resolution:** For an assignment to be active, `effective_from <= now AND effective_to >= now` (treating null as unbounded). Expired assignments MUST automatically disappear from `security_context` and permission resolution.

---

## 3. LIFECYCLE & STATE MANAGEMENT

### 3.1 Revocation vs. Deletion
- **Policy:** UBU assignments MUST NEVER be physically deleted (B03 §5.8).
- **Enforcement:** Revocation is performed via Soft-Delete (`is_active_membership = False`, `is_deleted = True`, `deleted_at = timezone.now()`).

### 3.2 Restore Cycles & Soft Delete
- **Policy:** Soft-deleted assignments CAN be restored without violating unique constraints.
- **Enforcement:** The `UniqueConstraint` on UBU MUST use `condition=Q(is_deleted=False)`. Historical (deleted) assignments do not block re-invites or restorations.

### 3.3 Business Unit Transfers
- **Policy:** Moving an employee from BU-A to BU-B is NOT a mutable operation on the UBU record.
- **Enforcement:** A transfer MUST be executed as:
  1. **Revoke** old assignment in BU-A (Soft delete).
  2. **Create** new assignment in BU-B.
- **Reasoning:** This guarantees absolute audit clarity regarding exactly when access ended at Location A and began at Location B.

### 3.4 Organization & Business Unit Suspension
- **Policy:** If an `Organization` or `BusinessUnit` is suspended/deleted, all child UBU access MUST be immediately disabled.
- **Suspension Precedence:** Parent state always wins. 
  - `Organization Suspended` OVERRIDES `BusinessUnit Active`
  - `BusinessUnit Suspended` OVERRIDES `UserBusinessUnit Active`
- **Enforcement:** Instead of mutating millions of UBU records, the `security_context` builder MUST verify the active status of the parent `BusinessUnit` and `Organization`. If the parent is inactive, the UBU is effectively dead, regardless of its own `is_active_membership` state.

---

## 4. SECURITY & CACHE GOVERNANCE

### 4.1 Selected Business Unit Context
- **Policy:** Every API request requiring tenant context MUST provide a valid `business_unit_id`.
- **Enforcement:** The middleware MUST validate that `security_context.selected_business_unit_id` maps to a currently ACTIVE `UserBusinessUnit` assignment for the requesting `User` before processing the request.

### 4.2 Cache Invalidation
- **Policy:** Stale access is a CRITICAL security violation.
- **Enforcement:** The system MUST immediately invalidate the RBAC Cache, Security Context Cache, and Permission Cache for the affected `User` whenever a UBU assignment is:
  - Created
  - Revoked (Soft-Deleted)
  - Restored
  - Transferred
  - Modified (Role changed)

---

## 5. AUDIT REQUIREMENTS

- **Policy:** Every UBU lifecycle event MUST generate an immutable audit log.
- **Enforcement:** Logs MUST track:
  - **Action:** (Assigned, Revoked, Restored, Role Changed, Transferred)
  - **Who:** (User ID performing the action)
  - **When:** (Timestamp in UTC)
  - **Old Value -> New Value:** (e.g., Role ID changed from X to Y)
  - **Reason:** (Optional string, required for compliance overrides)

---

## 6. MANDATORY TEST MATRIX

Before Phase 4 is considered complete, the following test scenarios MUST pass:

| Scenario                        | Required |
| ------------------------------- | -------- |
| Multi-role same BU              | PASS     |
| Domain mismatch role assignment | FAIL     |
| Temporary assignment active     | PASS     |
| Temporary assignment expired    | FAIL     |
| Transfer BU                     | PASS     |
| Organization suspended          | PASS     |
| BusinessUnit suspended          | PASS     |
| Cache invalidation              | PASS     |
| Audit event emission            | PASS     |
| Permission aggregation          | PASS     |

---
THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
