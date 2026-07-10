<!-- yss_orbit\docs\onboarding\backend-architecture.md -->
# Backend Architecture Guide

Read all rulebooks before writing any code.

## Layer Order (B04)
Request > Middleware > View > Serializer > Service > Repository > DB

## Key Laws
- Every query MUST include business_unit_id (B10)
- Service layer owns transactions (B01 Para 5.16)
- Events via outbox pattern only (E01)
- No SELECT star queries (B10 Para 3.1)
