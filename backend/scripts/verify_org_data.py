from apps.organization.models.organization_model import Organization

orgs = Organization.all_objects.all().order_by('name').values(
    'name', 'registration_number', 'gst_number', 'pan_number',
    'address_line1', 'address_line2', 'city', 'state', 'country', 'pincode',
    'phone', 'currency_code', 'currency_symbol', 'timezone'
)

print(f"\n{'='*80}")
for o in orgs:
    print(f"\nOrg      : {o['name']}")
    print(f"  Reg No : {o['registration_number']}")
    print(f"  GST    : {o['gst_number']}")
    print(f"  PAN    : {o['pan_number']}")
    print(f"  Address: {o['address_line1']}, {o['address_line2']}")
    print(f"  City   : {o['city']}, {o['state']}, {o['country']} - {o['pincode']}")
    print(f"  Phone  : {o['phone']}")
    print(f"  Locale : {o['currency_code']} ({o['currency_symbol']}) / {o['timezone']}")
print(f"\n{'='*80}\n")
