import re

with open('c:/PROJECT/yss_orbit/backend/config/settings/base.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_local_apps = """LOCAL_APPS = [
    "apps.iam",
    "apps.tenancy",
    "apps.platform",
    "apps.compliance",
    "apps.observability",
    "apps.organization",
    "apps.hrms",
    "apps.attendance",
    "apps.leave",
    "apps.payroll",
    "apps.recruitment",
    "apps.appraisal",
    "apps.hrms_core",
]"""

# Replace the LOCAL_APPS list in base.py
content = re.sub(r'LOCAL_APPS\s*=\s*\[.*?\]', new_local_apps, content, flags=re.DOTALL)

with open('c:/PROJECT/yss_orbit/backend/config/settings/base.py', 'w', encoding='utf-8') as f:
    f.write(content)
