# yss_orbit\backend\apps\rbac\selectors\rbac_selectors.py
class BaseSelector:
    def get_by_id(self, id):
        return None
    def get_all(self):
        return []
