<!-- yss_orbit\docs\runbooks\scaling-guide.md -->
# Scaling Guide Runbook

## Horizontal Scaling
- API servers: stateless, scale behind load balancer
- Celery workers: scale by queue depth (target less than 1000 pending)
- Redis: cluster mode for high availability

## Thresholds
- CPU above 80 percent for 5 min: Scale out API servers
- DB connections above 80 percent: Scale pgBouncer pool
- Queue depth above 5000 for 2 min: Scale Celery workers
- Table partitioning: audit_log and event_outbox above 10M rows
