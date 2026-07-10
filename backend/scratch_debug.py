from apps.organization.services.business_unit_service import BusinessUnitService
from apps.organization.models import BusinessUnit
import uuid

bu = BusinessUnit.objects.first()
if not bu:
    print("No BU found")
else:
    service = BusinessUnitService()
    try:
        updated_bu = service.update_business_unit(
            security_context=None,
            bu_id=bu.id,
            data={"name": "Test BU Edit", "branding_mode": "platform", "code": bu.code}
        )
        print("Success! Updated to:", updated_bu.name)
    except Exception as e:
        import traceback
        traceback.print_exc()
