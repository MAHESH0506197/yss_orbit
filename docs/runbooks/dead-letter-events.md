<!-- yss_orbit\docs\runbooks\dead-letter-events.md -->
# Dead-Letter Events Runbook (E01 Para 4.7)

## Response (on-call within 24 hours - mandatory per E01)
1. Identify root cause: consumer bug, invalid payload, external dependency
2. Fix consumer if code issue, then replay
3. If payload corrupt: investigate source, raise incident

## Commands
  GET /api/v1/platform/diagnostics/BU_ID/events/?status=dead_letter
  POST /api/v1/platform/events/EVENT_ID/replay/
