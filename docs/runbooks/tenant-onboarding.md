<!-- yss_orbit\docs\runbooks\tenant-onboarding.md -->
# Tenant Onboarding Runbook

## Automated Checklist (B24 Para 4.3)
- Organization created and active
- BusinessUnit created and active
- Subscription plan activated
- At least 1 module activated
- ORG_ADMIN user created
- Timezone configured
- Welcome email sent
- Branding defaults applied

## Commands
  python manage.py seed_tenant --org-name=NAME --plan=PLAN
