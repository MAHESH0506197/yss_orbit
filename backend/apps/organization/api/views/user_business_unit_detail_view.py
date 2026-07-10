# yss_orbit\backend\apps\user_business_unit\api\views\user_business_unit_detail_view.py
"""
Convenience alias — retrieve/update/delete handled by UserBusinessUnitViewSet.
Kept for any external direct imports.
"""
from apps.organization.api.views.user_business_unit_view import UserBusinessUnitViewSet  # noqa: F401

# Detail view is UserBusinessUnitViewSet.retrieve — accessed via the router.
UserBusinessUnitDetailView = UserBusinessUnitViewSet
