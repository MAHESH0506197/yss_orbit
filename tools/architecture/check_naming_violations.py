#!/usr/bin/env python
# yss_orbit\tools\architecture\check_naming_violations.py
"""
Naming Convention Linter (X01)
Checks all Python and TypeScript files for forbidden naming patterns.
Usage: python tools/architecture/check_naming_violations.py
"""
import os, re

FORBIDDEN_PATTERNS = [
    (r'\bbu_id\b', 'Use business_unit_id instead of bu_id'),
    (r'\bsector\b', 'Use domain instead of sector'),
    (r'\bMFA_REQUIRED\b.*200', 'Use MFA_OTP_SENT for 200 responses'),
    (r'\"error\":', 'Ensure error key is singular in envelope'),
]

def check_file(filepath):
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                for pattern, message in FORBIDDEN_PATTERNS:
                    if re.search(pattern, line):
                        issues.append(f'{filepath}:{i}: {message}')
    except Exception:
        pass
    return issues

def main():
    all_issues = []
    for root, _, files in os.walk('backend'):
        for fn in files:
            if fn.endswith('.py'):
                all_issues.extend(check_file(os.path.join(root, fn)))
    for root, _, files in os.walk('frontend/src'):
        for fn in files:
            if fn.endswith(('.ts', '.tsx')):
                all_issues.extend(check_file(os.path.join(root, fn)))
    if all_issues:
        print('NAMING VIOLATIONS:')
        for issue in all_issues:
            print(f'  {issue}')
    else:
        print('No naming violations found.')

if __name__ == '__main__':
    main()
