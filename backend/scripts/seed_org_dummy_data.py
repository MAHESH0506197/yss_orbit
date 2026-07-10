"""
yss_orbit/backend/scripts/seed_org_dummy_data.py

Run with:
    python manage.py shell < scripts/seed_org_dummy_data.py

Updates the 5 seeded organizations with realistic dummy data
for all blank/missing fields ONLY. System fields (created_by_id,
updated_by_id, deleted_by_id, subscription_id, owner_id) are
intentionally left NULL — they are real relational IDs.
"""

from apps.organization.models.organization_model import Organization

# ─── Update map: keyed by slug ───────────────────────────────────────────────
UPDATES = {

    # ── 1. YSS Orbit Systems — Bangalore, Karnataka, India ──────────────────
    "yss-orbit-platform": {
        "registration_number": "U72900KA2020PTC134567",
        "gst_number":          "29AADCY3243P1ZQ",
        "pan_number":          "AADCY3243P",
        "address_line1":       "No. 42, Outer Ring Road, Marathahalli",
        "address_line2":       "3rd Floor, YSS Tech Park",
        "pincode":             "560037",
        # Already has: name, slug, email, phone, city, state, country, domain
        # locale, is_verified
    },

    # ── 2. Nexus Technologies — San Francisco, CA, USA ───────────────────────
    "nexus-tech": {
        "registration_number": "C4567891",          # California Corp No.
        "gst_number":          "98-7654321",         # EIN (US equivalent)
        "pan_number":          "NEXUS-US-001",       # Internal reference; US has no PAN
        "address_line1":       "101 Market Street, Suite 1800",
        "address_line2":       "Financial District",
        "state":               "California",
        "pincode":             "94105",
        "timezone":            "America/Los_Angeles",
        "currency_code":       "USD",
        "currency_symbol":     "$",
    },

    # ── 3. Quantum Health — London, England, UK ──────────────────────────────
    "quantum-health": {
        "registration_number": "QH12345678",        # UK Companies House style
        "gst_number":          "GB 123 4567 89",    # UK VAT number
        "pan_number":          "QH-UK-HEALTH-01",   # Internal reference; UK has no PAN
        "address_line1":       "1 Canada Square",
        "address_line2":       "Canary Wharf",
        "state":               "England",
        "country":             "GB",                # Fix: was "UK" — ISO 3166-1 is "GB"
        "pincode":             "E14 5AB",
        "timezone":            "Europe/London",
        "currency_code":       "GBP",
        "currency_symbol":     "£",
    },

    # ── 4. Stellar Logistics — Dubai, UAE ────────────────────────────────────
    "stellar-logistics": {
        "registration_number": "CN-1234567",
        "gst_number":          "100123456700003",   # UAE TRN (Tax Registration No.)
        "pan_number":          "SL-AE-2020-001",    # Internal; AE has no PAN
        "phone":               "+971-4-567-8901",
        "address_line1":       "Office 801, DAMAC Business Tower",
        "address_line2":       "Business Bay",
        "state":               "Dubai",
        "pincode":             "500001",
        "timezone":            "Asia/Dubai",
        "currency_code":       "AED",
        "currency_symbol":     "د.إ",
        "website":             "https://stellarlogistics.net",
    },

    # ── 5. Paynex — Mumbai, Maharashtra, India ───────────────────────────────
    "paynex": {
        "registration_number": "U74999MH2018PTC310234",
        "gst_number":          "27AABCP9876Q1Z3",   # Maharashtra state code 27
        "pan_number":          "AABCP9876Q",
        "address_line1":       "Level 12, Tower B, One BKC",
        "address_line2":       "Bandra Kurla Complex",
        "pincode":             "400051",
        "website":             "https://paynex.com",
    },
}

# ─── Apply updates ────────────────────────────────────────────────────────────
updated_count = 0
skipped_count = 0

for slug, fields in UPDATES.items():
    try:
        org = Organization.all_objects.get(slug=slug)
        for field, value in fields.items():
            setattr(org, field, value)
        # Use update_fields to avoid triggering auto_now on updated_at
        # (or let it update — it's a data seed, so updated_at update is fine)
        org.save(update_fields=list(fields.keys()) + ["updated_at"])
        updated_count += 1
        print(f"  ✅  [{slug}]  {org.name} — updated {len(fields)} fields")
    except Organization.DoesNotExist:
        skipped_count += 1
        print(f"  ⚠️   [{slug}]  Organization not found — skipped")
    except Exception as e:
        print(f"  ❌  [{slug}]  Error: {e}")

print(f"\n{'─'*60}")
print(f"  Done: {updated_count} updated,  {skipped_count} skipped.")
print(f"{'─'*60}")
