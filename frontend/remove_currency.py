import re

# 1. OrganizationForm.tsx
try:
    path = r"C:\PROJECT\yss_orbit\frontend\src\features\organization\components\OrganizationForm.tsx"
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()
    
    # We remove the entire "Locale Defaults" block.
    # From: {/* ─── LOCALE DEFAULTS ─────────────────────────────────────── */}
    # To: {/* ─── BRANDING & IDENTITY ─────────────────────────────────── */}
    
    pattern = r'\{/\*\s*─── LOCALE DEFAULTS ───────────────────────────────────────\s*\*/\}[\s\S]*?(?=\{/\*\s*─── BRANDING & IDENTITY ───────────────────────────────────\s*\*/\})'
    c = re.sub(pattern, '', c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated OrganizationForm.tsx")
except Exception as e:
    print(e)


# 2. SettingsForm.tsx
try:
    path = r"C:\PROJECT\yss_orbit\frontend\src\features\tenancy\tenantSettings\components\SettingsForm.tsx"
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()

    # Remove currency block
    pattern_currency = r'<div className="space-y-1\.5 transition-transform duration-200 focus-within:translate-x-0\.5">\s*<label[^>]*>Default Currency</label>[\s\S]*?</select>\s*</div>\s*</div>'
    c = re.sub(pattern_currency, '', c)
    
    # Remove timezone block
    pattern_timezone = r'<div className="space-y-1\.5 transition-transform duration-200 focus-within:translate-x-0\.5">\s*<label[^>]*>Timezone</label>[\s\S]*?</select>\s*</div>\s*</div>'
    c = re.sub(pattern_timezone, '', c)

    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated SettingsForm.tsx")
except Exception as e:
    print(e)

