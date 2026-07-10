# yss_orbit/backend/apps/organization/constants/constants.py
"""
YSS Orbit — Organization Module Constants

FIX: SLUG_REGEX was a plain string (r'^[a-z0-9-]+$'), causing AttributeError
     in OrganizationCreateUpdateSerializer.validate_slug() which called .match().
     Now using re.compile() to produce a proper compiled regex object.

FIX: CODE_REGEX_PATTERN was missing the $ anchor and hyphen character.
     Pattern now correctly represents [A-Z0-9_-]{2,20}.
"""
import re

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

STATUS_ACTIVE = 'active'
STATUS_INACTIVE = 'inactive'

# ─── Compiled Regex Objects (use these for .match() / .search()) ──────────────
SLUG_REGEX = re.compile(r'^[a-z0-9-]+$')
GST_REGEX  = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
PAN_REGEX  = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
HEX_REGEX  = re.compile(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
CODE_REGEX = re.compile(r'^[A-Z0-9_-]{2,20}$')
PHONE_REGEX = re.compile(r'^\+?[1-9]\d{1,14}$')

# ─── Raw Pattern Strings (use these when passing to serializers as strings) ───
SLUG_REGEX_PATTERN      = r'^[a-z0-9-]+$'
GST_REGEX_PATTERN       = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
PAN_REGEX_PATTERN       = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
HEX_REGEX_PATTERN       = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
CODE_REGEX_PATTERN      = r'^[A-Z0-9_-]{2,20}$'
PHONE_REGEX_PATTERN     = r'^\+?[1-9]\d{1,14}$'

# ─── Ordering ─────────────────────────────────────────────────────────────────
ALLOWED_ORDERINGS = [
    'name', '-name',
    'created_at', '-created_at',
    'updated_at', '-updated_at',
    'code', '-code',
    'is_active', '-is_active',
]
