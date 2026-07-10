<!-- yss_orbit\rulebooks\B18 - MULTI-ENVIRONMENT & DEPLOYMENT GOVERNANCE.md -->
# B18 - MULTI-ENVIRONMENT & DEPLOYMENT GOVERNANCE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B09 (Data Security), B15 (Logging), B17 (Seed Data)
**Governance Role:** Deployment & Environment Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Environment definitions, deployment pipeline governance, deployment gating, rollback governance, feature flag governance, configuration isolation, production access controls, migration governance per environment, environment promotion rules |
| REFERENCES | B01 (config rules §5.25, fail-fast), B09 (secrets management), B17 (seed + migration coordination), B15 (deployment observability) |
| MUST NOT DUPLICATE | Secrets management (B09), migration rules (B08), seed governance (B17) |

---

## 1. PURPOSE

This rulebook defines **deployment and environment governance** for YSS Orbit.

It establishes:
- Environment definitions and isolation
- Deployment pipeline governance
- Deployment gating requirements
- Rollback governance
- Configuration isolation

All deployments MUST follow these rules.

---

## 2. SCOPE

Applies to: all deployment environments, all CI/CD pipelines, all deployment processes, all environment configurations. No deployment is exempt.

---

## 3. ENVIRONMENT DEFINITIONS

| Environment | Purpose | Data | Access |
|------------|---------|------|--------|
| **Development** | Local development | Developer-only fixtures | Developer only |
| **Staging** | Pre-production validation | Anonymized copy of production schema | Engineering team |
| **Production** | Live platform | Real tenant data | Controlled + audited |

Environment isolation MUST be enforced at the configuration, database, storage, and access level.

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Environment Isolation (MANDATORY)

- Development, staging, and production environments MUST use separate configurations
- Shared databases across environments are PROHIBITED
- Shared storage buckets across environments are PROHIBITED
- Configuration values MUST NOT be shared across environments
- Production secrets MUST NOT be accessible in development or staging environments

### 4.2 CI/CD Pipeline Governance (MANDATORY)

All deployments MUST pass the following gates in sequence:

```text
1. Code review approval (minimum 1 senior engineer)
2. All automated tests pass (unit, integration, security, contract)
3. Security scan passes (dependency scan, secret scan, SAST)
4. Database migration review (for schema changes)
5. Deployment to staging
6. Staging smoke tests pass
7. Deployment to production (gated release)
```

Skipping any gate is PROHIBITED. Emergency deployments MUST follow the break-glass process (§4.10).

### 4.3 Deployment Gating (MANDATORY)

Production deployments MUST be blocked unless ALL of the following pass:

```text
□ All automated tests pass
□ No failing security scans
□ All database migrations are reviewed and tested
□ Staging deployment is successful
□ Staging smoke tests pass
□ Feature flags configured correctly for release
□ Rollback plan documented and tested
□ Observability configured (metrics, alerts)
```

Any failing gate = deployment BLOCKED.

### 4.4 Configuration Management (MANDATORY)

- All configuration MUST come from environment variables (never hardcoded)
- Required configuration MUST be validated at startup
- System MUST fail fast if required configuration is missing or invalid
- Configuration files MUST NOT contain secrets
- `.env.production` files in version control are PROHIBITED

Required startup validation:
```python
REQUIRED_ENV_VARS = [
    "SECRET_KEY", "DATABASE_URL", "REDIS_URL",
    "AWS_S3_BUCKET", "ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS",
]
for var in REQUIRED_ENV_VARS:
    if not os.environ.get(var):
        raise EnvironmentError(f"Required environment variable missing: {var}")
```

### 4.5 Database Migration Governance (MANDATORY)

- Migrations MUST run before the new application version goes live
- Zero-downtime migration standards from B08 §4.12 MUST be applied
- No-rollback migrations MUST be flagged and reviewed before deployment
- Migrations MUST be tested on a staging DB copy before production execution
- Destructive migrations (column drops, table drops) MUST have a documented data verification step

### 4.6 Rollback Governance (MANDATORY)

- Every deployment MUST have a documented rollback plan
- Rollback MUST be tested in staging before production deployment
- Rollback plans MUST include: application code rollback, migration rollback (if reversible), cache clearing, feature flag revert
- Irreversible migrations MUST be separately approved by Architecture Review

### 4.7 Feature Flag Governance (MANDATORY)

- New features MUST be gated behind feature flags for controlled release
- Feature flags MUST be stored in configuration - not hardcoded
- Feature flags MUST be removable without code changes once fully released
- Feature flags MUST NOT be used to bypass security controls or RBAC
- Permanent feature flags are PROHIBITED - all flags MUST have a documented removal date

### 4.8 Production Access Controls (MANDATORY)

- Production database MUST require multi-factor authentication for human access
- Production database direct access MUST be restricted to approved operations
- All production access MUST be logged and audited
- Production data MUST NOT be copied to development or staging without anonymization
- Debugging production issues MUST use logging and tracing - direct database inspection requires approval

### 4.9 Production Data Access Governance (MANDATORY)

- Production data MUST NOT be accessed directly for debugging without explicit approval
- Approved production DB access MUST be audited and time-limited
- Production data MUST NOT be exported to insecure storage
- PII in production MUST NOT be shared outside the platform without compliance review

### 4.10 Break-Glass Emergency Process (MANDATORY)

For emergency production fixes bypassing standard CI/CD:

1. Written approval from Engineering Lead AND Security Lead REQUIRED
2. Fix MUST be the minimum change necessary
3. All actions MUST be audit-logged with `break_glass=True`
4. Break-glass session MUST be time-limited (maximum 4 hours)
5. Full post-incident review MUST occur within 48 hours
6. Standard deployment process MUST be applied retroactively

Undocumented emergency deployments are PROHIBITED.

### 4.11 Dependency Management (MANDATORY)

- Dependency updates MUST be tested before production deployment
- Critical security vulnerabilities in dependencies MUST be patched within defined SLA
- Dependency versions MUST be pinned in production
- Automated dependency scanning MUST run in CI/CD pipeline

### 4.12 Observability Readiness (MANDATORY)

Before any production deployment:
- Monitoring dashboards MUST be updated for new features
- Alerts MUST be configured for new critical paths
- Log coverage MUST be verified for new endpoints and operations

---

## 5. SECURITY & COMPLIANCE

- Unauthorized production access = CRITICAL violation
- Deploying without CI/CD gates = CRITICAL violation
- Production data in development = CRITICAL violation
- Configuration secrets in version control = CRITICAL violation

---

## 6. NON-NEGOTIABLE RULES

- Skipping CI/CD gates = CRITICAL violation
- Deploying to production without staging validation = PROHIBITED
- Direct production DB access without approval = CRITICAL violation
- Production data in development without anonymization = CRITICAL violation
- Configuration secrets in version control = CRITICAL violation
- Feature flags bypassing RBAC = PROHIBITED
- Permanent feature flags = PROHIBITED
- Missing rollback plan = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment + incident review |
| HIGH | Reject changes |
| MEDIUM | Fix required before next release |

---

## 8. TESTING REQUIREMENTS

- All CI/CD gates MUST be validated
- Configuration validation MUST be tested (fail-fast for missing vars)
- Rollback MUST be tested in staging
- Feature flag behavior MUST be tested
- Production access controls MUST be audited
- Any failing test MUST block deployment

---

## 9. QUICK SUMMARY

- Environments MUST be isolated (configs, databases, storage)
- All deployments MUST pass CI/CD gates
- Rollback plan REQUIRED for every deployment
- Feature flags MUST gate new features - never bypass security
- Production access MUST be restricted, MFA-protected, and audited

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.
