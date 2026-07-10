<!-- yss_orbit\backend\docs\architecture.md -->
# Architecture

Orbit is built on Django with a strictly enforced layered architecture:
1. **API Layer** (Views, Serializers, Routing)
2. **Service Layer** (Business logic coordination)
3. **Repository Layer** (Data access, ORM queries)
4. **Core Framework** (Telemetry, Middleware, Security, Base Classes)
