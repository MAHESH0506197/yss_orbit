<!-- yss_orbit\rulebooks\B10 - SECURE QUERY & ORM PRACTICES.md -->
# B10 - SECURE QUERY & ORM PRACTICES

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B08 (Database Design), B09 (Data Security)
**Governance Role:** Query Security Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Safe ORM usage, object-level tenant scope enforcement, parameterized query enforcement, injection prevention, query optimization (N+1, eager loading), pagination safety, raw SQL governance, bulk operation safety, slow query enforcement |
| REFERENCES | B01 (unbounded query prohibition, SELECT * prohibition), B02 (tenant filtering - two-layer), B08 (indexes) |
| MUST NOT DUPLICATE | Tenant isolation logic (B02), transaction management (B01 §5.16), migration rules (B08) |

---

## 1. PURPOSE

This rulebook defines **secure query and ORM usage standards** for YSS Orbit.

It establishes:
- Safe database query practices
- ORM usage rules (Django ORM)
- Protection against injection attacks
- Query performance and optimization
- Object-level tenant scope enforcement

All data access MUST follow these rules.

---

## 2. SCOPE

Applies to: all database queries (ORM and raw SQL), all repository layer operations, all filtering/searching/sorting logic. No query is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 ORM Usage (MANDATORY)

- Django ORM MUST be used for all database operations
- Raw SQL MUST NOT be used unless explicitly justified and architect-reviewed
- `cursor.execute()` directly in application code outside the approved DB layer = PROHIBITED
- `SELECT *` and its ORM equivalents (`Model.objects.all()`, `Model.objects.values()` without fields) are PROHIBITED

```python
# PROHIBITED:
Item.objects.all()              # Unscoped + SELECT *
Item.objects.values()           # No explicit field selection
cursor.execute("SELECT * ...")  # Raw unscoped SQL

# REQUIRED:
Item.objects.only("id", "name", "price")
Item.objects.values("id", "name", "price")
```

### 3.2 Object-Level Tenant Scope (MANDATORY)

All ORM queries on tenant-owned data MUST include `business_unit_id`. Fetching by primary key alone is PROHIBITED for tenant-owned models.

```python
# PROHIBITED:
Item.objects.get(id=item_id)              # No tenant scope
Item.objects.filter(id__in=id_list)       # No tenant scope

# REQUIRED:
Item.objects.get(
    id=item_id,
    business_unit_id=selected_bu_id,
    is_deleted=False,
)
Item.objects.filter(
    business_unit_id=selected_bu_id,
    is_deleted=False,
    is_active=True,
)
```

**Violation:** Object fetch without tenant scope = CRITICAL security breach.

### 3.3 Parameterized Queries (MANDATORY)

All queries MUST use parameterized inputs. String concatenation or f-strings in queries are PROHIBITED.

```python
# PROHIBITED (SQL Injection risk):
query = f"SELECT * FROM items WHERE name = '{name}'"
query = "SELECT * FROM items WHERE name = '%s'" % name

# REQUIRED:
query = "SELECT id, name FROM items WHERE business_unit_id = %s AND name = %s"
secure_db.fetch_all(query, [business_unit_id, name])
```

**Violation:** Unparameterized query = CRITICAL SQL injection risk.

### 3.4 Active Record Filtering (MANDATORY)

All user-facing queries MUST filter soft-deleted and inactive records:

```python
# REQUIRED on all user-facing queries:
queryset = Item.objects.filter(
    business_unit_id=selected_bu_id,
    is_deleted=False,
    is_active=True,
)
```

Returning deleted or inactive records to users without explicit admin/audit context = PROHIBITED.

### 3.5 Query Optimization - N+1 Prevention (MANDATORY)

- N+1 queries are PROHIBITED
- Related data MUST use `select_related` or `prefetch_related`

```python
# PROHIBITED - N+1:
for order in orders:
    print(order.customer.name)  # 1 query per order

# REQUIRED:
orders = Order.objects.select_related("customer").filter(
    business_unit_id=ctx.selected_business_unit_id,
    is_deleted=False
)
```

### 3.6 Pagination (MANDATORY)

- Large result sets MUST be paginated
- Unbounded queries are PROHIBITED
- `page_size` MUST have a validated maximum (`MAX_PAGE_SIZE`)
- Requests exceeding `MAX_PAGE_SIZE` MUST be rejected

### 3.7 Field Selection (MANDATORY)

- Queries MUST select only required fields
- Fetching unnecessary columns is PROHIBITED

```python
# REQUIRED:
User.objects.only("id", "email", "is_active")

# PROHIBITED:
User.objects.all()   # Fetches all fields - no column selection
```

### 3.8 Raw SQL Rules (STRICTLY CONTROLLED)

Raw SQL MUST be:
- Fully parameterized (no string concatenation)
- Code-reviewed and approved by an architect
- Limited to cases where ORM cannot produce an efficient query
- Executed through the approved DB access layer only
- Covered by tests

Unsafe raw SQL is PROHIBITED.

### 3.9 Index Usage Validation (MANDATORY)

- Queries MUST use indexes effectively
- Full table scans on tables with > 10,000 rows are PROHIBITED unless justified
- Every new query on a table with > 10,000 rows MUST be validated with `EXPLAIN ANALYZE` in development before merging

```sql
EXPLAIN ANALYZE
SELECT id, name FROM inventory
WHERE business_unit_id = '...' AND is_deleted = FALSE
ORDER BY name;
-- Must show "Index Scan" not "Seq Scan" for indexed columns
```

### 3.10 Bulk Operations (MANDATORY)

- Bulk operations MUST use `bulk_create`, `bulk_update`, or equivalent batch methods
- Repeated single-record queries inside loops are PROHIBITED
- Bulk operations MUST include tenant scope

```python
# PROHIBITED - N inserts:
for item in items:
    Item.objects.create(**item)

# REQUIRED:
Item.objects.bulk_create(items_with_bu_id, batch_size=500)
```

### 3.11 Transaction Safety (MANDATORY)

- Critical multi-step operations MUST use transactions (governed by B01 §5.16)
- Partial writes across related records are PROHIBITED
- Transactions MUST be managed in Service Layer - never Repository Layer

### 3.12 Slow Query Enforcement (MANDATORY)

All database queries MUST be timed. Slow queries MUST be logged with severity.

| Duration | Severity | Required Action |
|----------|---------|----------------|
| > 200ms | WARNING | Log with query excerpt |
| > 500ms | CRITICAL | Log + alert monitoring system |

```python
import time

start = time.time()
result = execute_query(...)
elapsed_ms = (time.time() - start) * 1000

if elapsed_ms > 500:
    logger.critical(f"SLOW QUERY CRITICAL ({elapsed_ms:.0f}ms): {query[:150]}")
elif elapsed_ms > 200:
    logger.warning(f"SLOW QUERY WARNING ({elapsed_ms:.0f}ms): {query[:150]}")
```

### 3.13 Tenant-Aware Unique Constraint Queries (MANDATORY)

Uniqueness checks within a tenant MUST include `business_unit_id` in the query filter:

```python
# REQUIRED:
if Item.objects.filter(
    business_unit_id=ctx.selected_business_unit_id,
    code=item_code,
    is_deleted=False
).exists():
    raise ConflictError("Item code already exists in this Business Unit")
```

---

## 4. SECURITY & COMPLIANCE

- All queries MUST be secure, validated, and tenant-scoped
- Injection vulnerabilities are CRITICAL violations
- Cross-tenant data exposure via queries is a CRITICAL violation
- Raw SQL MUST be reviewed and documented before use

---

## 5. NON-NEGOTIABLE RULES

- Object fetch without tenant scope = CRITICAL violation
- SQL injection vulnerability = CRITICAL violation
- N+1 queries = PROHIBITED
- `SELECT *` in production = PROHIBITED
- Unparameterized queries = PROHIBITED
- Unbounded queries = PROHIBITED
- Returning soft-deleted records to users = PROHIBITED
- Slow queries undetected in production = HIGH risk

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Tenant filtering MUST be tested on all queries
- Object-level tenant scope MUST be tested
- SQL injection prevention MUST be tested
- Performance tests MUST validate query efficiency (`EXPLAIN ANALYZE`)
- Pagination MUST be validated
- N+1 absence MUST be verified
- Slow query detection MUST be verified
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- ORM MUST be used safely - select only needed fields
- ALL tenant-owned queries MUST include `business_unit_id` and `is_deleted=False`
- Object-level fetch by ID alone = PROHIBITED
- Parameterized queries REQUIRED - no string concatenation
- N+1 = PROHIBITED
- Slow queries MUST be detected (200ms WARNING / 500ms CRITICAL)

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
