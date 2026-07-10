import os
import re

TEST_API = r"C:\PROJECT\yss_orbit\backend\apps\organization\tests\test_organization_api.py"
TEST_MODEL = r"C:\PROJECT\yss_orbit\backend\apps\organization\tests\test_organization_model.py"
TEST_SERVICE = r"C:\PROJECT\yss_orbit\backend\apps\organization\tests\test_organization_service.py"

def fix_api():
    with open(TEST_API, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to remove the test functions that test slug logic:
    # test_create_duplicate_slug_rejected
    # test_create_invalid_slug_format_rejected
    # test_create_auto_generates_slug_from_name
    # test_slug_uniqueness_on_update
    # test_meta_returns_slug_regex

    content = re.sub(r'\n    def test_create_duplicate_slug_rejected[\s\S]*?(?=\n    def test|$)', '', content)
    content = re.sub(r'\n    def test_create_invalid_slug_format_rejected[\s\S]*?(?=\n    def test|$)', '', content)
    content = re.sub(r'\n    def test_create_auto_generates_slug_from_name[\s\S]*?(?=\n    def test|$)', '', content)
    content = re.sub(r'\n    def test_slug_uniqueness_on_update[\s\S]*?(?=\n    def test|$)', '', content)
    content = re.sub(r'\n    def test_meta_returns_slug_regex[\s\S]*?(?=\n    def test|$)', '', content)

    # Remove `slug=...` from dummy setups
    content = re.sub(r',\s*slug=f?["\'][^"\']*["\']', '', content)
    content = re.sub(r'"slug":\s*f?["\'][^"\']*["\']\s*,?\s*', '', content)
    content = re.sub(r'"slug":\s*organization\.slug\s*,?\s*', '', content)

    # Clean up any trailing commas in dicts or calls caused by the above
    # Not perfect but let's try
    with open(TEST_API, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_model():
    with open(TEST_MODEL, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'\n    def test_slug_auto_generated[\s\S]*?(?=\n    def test|$)', '', content)
    content = re.sub(r'\n    def test_slug_uniqueness_enforced[\s\S]*?(?=\n    def test|$)', '', content)
    with open(TEST_MODEL, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_service():
    with open(TEST_SERVICE, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'\n    def test_duplicate_slug_raises[\s\S]*?(?=\n    def test|$)', '', content)
    # also remove assert org.slug == org_data["slug"]
    content = re.sub(r'\s*assert org\.slug == org_data\["slug"\]', '', content)
    content = re.sub(r'"slug":\s*["\'][^"\']*["\']\s*,?\s*', '', content)
    with open(TEST_SERVICE, 'w', encoding='utf-8') as f:
        f.write(content)

fix_api()
fix_model()
fix_service()
print("Fixed slug references in tests.")
