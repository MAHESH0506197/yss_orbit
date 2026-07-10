<!-- yss_orbit\docs\adr\ADR-008-celery-task-queue.md -->
# ADR-008: Celery + Redis Task Queue

Status: Accepted

## Decision
Celery with Redis/Valkey backend.

## Rationale
- Python-native async task queue
- Supports exponential backoff (B13 Para 3.5)
- Flower for queue monitoring
- Dead-letter handling per E01
