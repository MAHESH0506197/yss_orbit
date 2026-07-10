<!-- yss_orbit\backend\docs\event_architecture.md -->
# Event Architecture

Orbit uses the Transactional Outbox pattern.
Domain events are written to an `Outbox` table atomically with business data. A Celery worker polls the outbox and publishes the events to a broader Event Bus.
