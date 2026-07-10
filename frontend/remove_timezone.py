import re

files_to_check = [
    r"C:\PROJECT\yss_orbit\frontend\src\features\organization\components\OrganizationForm.tsx",
    r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\components\UserFormModal.tsx",
    r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserCreatePage.tsx",
    r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserEditPage.tsx",
    r"C:\PROJECT\yss_orbit\frontend\src\features\tenancy\tenantSettings\components\SettingsForm.tsx"
]

def remove_timezone_block(content):
    # Match a generic block containing Timezone label and select
    # E.g. <div class...><label>Timezone</label><select ...>...</select></div>
    
    # Simple strategy: Find "Timezone" and remove the parent wrapper div.
    # We can do this manually since regex for nested html is tricky. Let's just use simple replacements or targeted regex.
    pass

# We will just write precise regexes for each file.

# 1. OrganizationForm.tsx
try:
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\organization\components\OrganizationForm.tsx", "r", encoding="utf-8") as f:
        c = f.read()
    # Find:
    # <div className="col-span-2 sm:col-span-1">
    #   <Field label="Timezone" error={errors.timezone?.message}>
    #      ...
    #   </Field>
    # </div>
    pattern = r'<div className="col-span-2 sm:col-span-1">\s*<Field label="Timezone"[\s\S]*?</Field>\s*</div>'
    c = re.sub(pattern, '', c)
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\organization\components\OrganizationForm.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated OrganizationForm.tsx")
except Exception as e:
    print(e)


# 2. UserFormModal.tsx
try:
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\components\UserFormModal.tsx", "r", encoding="utf-8") as f:
        c = f.read()
    pattern = r'<div className="space-y-1\.5">\s*<label[^>]*>Timezone</label>\s*<select \{\.\.\.register\(\'timezone\'\)\}[\s\S]*?</select>\s*</div>'
    c = re.sub(pattern, '', c)
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\components\UserFormModal.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated UserFormModal.tsx")
except Exception as e:
    print(e)

# 3. UserCreatePage.tsx
try:
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserCreatePage.tsx", "r", encoding="utf-8") as f:
        c = f.read()
    pattern = r'<div>\s*<label[^>]*>\s*Timezone[\s\S]*?<select \{\.\.\.register\(\'timezone\'\)\}[\s\S]*?</select>\s*</div>'
    c = re.sub(pattern, '', c)
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserCreatePage.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated UserCreatePage.tsx")
except Exception as e:
    print(e)

# 4. UserEditPage.tsx
try:
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserEditPage.tsx", "r", encoding="utf-8") as f:
        c = f.read()
    pattern = r'<div>\s*<label[^>]*>\s*Timezone[\s\S]*?<select \{\.\.\.register\(\'timezone\'\)\}[\s\S]*?</select>\s*</div>'
    c = re.sub(pattern, '', c)
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserEditPage.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated UserEditPage.tsx")
except Exception as e:
    print(e)

# 5. SettingsForm.tsx
try:
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\tenancy\tenantSettings\components\SettingsForm.tsx", "r", encoding="utf-8") as f:
        c = f.read()
    pattern = r'<div>\s*<label[^>]*>\s*Timezone[\s\S]*?<div className="relative">[\s\S]*?<select value=\{timezone\}[\s\S]*?</select>\s*</div>\s*</div>'
    c = re.sub(pattern, '', c)
    with open(r"C:\PROJECT\yss_orbit\frontend\src\features\tenancy\tenantSettings\components\SettingsForm.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated SettingsForm.tsx")
except Exception as e:
    print(e)
