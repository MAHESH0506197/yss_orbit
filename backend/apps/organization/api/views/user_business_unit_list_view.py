# yss_orbit\backend\apps\user_business_unit\api\views\user_business_unit_list_view.py
"""
Convenience alias — the list action is handled by UserBusinessUnitViewSet.
Kept for any external direct imports.
"""
from apps.organization.api.views.user_business_unit_view import UserBusinessUnitViewSet  # noqa: F401

# List view is UserBusinessUnitViewSet.list — accessed via the router.
UserBusinessUnitListView = UserBusinessUnitViewSet
