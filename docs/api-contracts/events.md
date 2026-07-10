<!-- yss_orbit\docs\api-contracts\events.md -->
# API Contract: Domain Events

## Event Envelope Schema
- event_id: UUID
- event_type: string
- business_unit_id: UUID
- correlation_id: UUID
- payload: object
- published_at: datetime ISO8601
