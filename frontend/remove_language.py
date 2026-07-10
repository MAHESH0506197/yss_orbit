import os
import re

# 1. Header.tsx (Remove LanguageSwitcher import and usage)
header_path = r"C:\PROJECT\yss_orbit\frontend\src\components\layouts\header\Header.tsx"
try:
    with open(header_path, "r", encoding="utf-8") as f:
        c = f.read()
    c = re.sub(r'import\s+\{\s*LanguageSwitcher\s*\}\s*from\s*\'@/components/shared/LanguageSwitcher\';?\n?', '', c)
    c = re.sub(r'\{\s*/\*\s*Language Switcher\s*\*/\s*\}\s*<LanguageSwitcher\s*/>\n?', '', c)
    with open(header_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated Header.tsx")
except Exception as e:
    print(e)


# 2. Delete LanguageSwitcher.tsx
switcher_path = r"C:\PROJECT\yss_orbit\frontend\src\components\shared\LanguageSwitcher.tsx"
try:
    if os.path.exists(switcher_path):
        os.remove(switcher_path)
        print("Deleted LanguageSwitcher.tsx")
except Exception as e:
    print(e)


# 3. UserFormModal.tsx
try:
    path = r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\components\UserFormModal.tsx"
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()
    
    # Remove Language field block
    pattern_lang = r'<div className="space-y-1\.5">\s*<label[^>]*>Language</label>[\s\S]*?</select>\s*</div>'
    c = re.sub(pattern_lang, '', c)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated UserFormModal.tsx")
except Exception as e:
    print(e)

# 4. UserCreatePage.tsx
try:
    path = r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserCreatePage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()
    
    pattern_lang = r'<div>\s*<label[^>]*>\s*Language[\s\S]*?<select \{\.\.\.register\(\'language\'\)\}[\s\S]*?</select>\s*</div>'
    c = re.sub(pattern_lang, '', c)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated UserCreatePage.tsx")
except Exception as e:
    print(e)

# 5. UserEditPage.tsx
try:
    path = r"C:\PROJECT\yss_orbit\frontend\src\features\iam\users\pages\UserEditPage.tsx"
    with open(path, "r", encoding="utf-8") as f:
        c = f.read()
    
    pattern_lang = r'<div>\s*<label[^>]*>\s*Language[\s\S]*?<select \{\.\.\.register\(\'language\'\)\}[\s\S]*?</select>\s*</div>'
    c = re.sub(pattern_lang, '', c)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated UserEditPage.tsx")
except Exception as e:
    print(e)

