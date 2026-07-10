<!-- yss_orbit\docs\runbooks\background-job-failures.md -->
# Background Job Failures Runbook (B13 Para 3.5)

## Retry Policy
- 1st retry: 60s
- 2nd retry: 120s
- 3rd retry: 240s
- 4th retry: 480s
- 5th: Dead-letter queue

## Steps
1. Check Celery worker logs
2. Check dead-letter queue in platform admin
3. Inspect task payload
4. Replay task if safe: python manage.py replay_dead_letter --task-id=ID
