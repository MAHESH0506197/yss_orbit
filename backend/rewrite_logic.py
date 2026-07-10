# yss_orbit\backend\rewrite_logic.py
import os
import re

APPS = ["users", "user_business_unit", "rbac", "organization", "business_unit", "tenancy", "platform", "feature_flags"]
BASE_DIR = r"c:/PROJECT/yss_orbit/backend/apps"

for app in APPS:
    app_dir = os.path.join(BASE_DIR, app)
    # process views
    views_dir = os.path.join(app_dir, "api", "views")
    if os.path.exists(views_dir):
        for view_file in os.listdir(views_dir):
            if view_file.endswith(".py") and not view_file.startswith("__"):
                filepath = os.path.join(views_dir, view_file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if it has a ViewSet
                if "class " in content and "ViewSet" in content:
                    # Add imports if missing
                    if "IsTenantMember" not in content:
                        content = "from core.permissions.tenant_permission import IsTenantMember\n" + content
                    if "HasRBACPermission" not in content:
                        content = "from core.permissions.rbac_permission import HasRBACPermission\n" + content
                        
                    # Replace permission_classes
                    content = re.sub(r"permission_classes\s*=\s*\[.*?\]", "permission_classes = [IsTenantMember, HasRBACPermission]", content)
                    
                    # Add required_permissions if not present
                    class_match = re.search(r"class\s+([A-Za-z0-9_]+ViewSet)[\s\S]*?(?=class|\Z)", content)
                    if class_match:
                        class_body = class_match.group(0)
                        if "required_permissions" not in class_body:
                            model_name_guess = view_file.replace("_view.py", "").replace("_views.py", "")
                            req_perm = f"    required_permissions = ['{app}.view_{model_name_guess}']\n"
                            content = re.sub(r"(permission_classes\s*=\s*\[.*?\]\n)", r"\1" + req_perm, content)
                            
                        # Replace get_queryset
                        if "def get_queryset(self):" in class_body:
                            new_qs = """def get_queryset(self):
        tenant_id = self.request.headers.get("X-Tenant-ID") or self.request.query_params.get("tenant_id")
        qs = super().get_queryset() if hasattr(super(), 'get_queryset') else self.queryset
        if getattr(self.request.user, "is_super_admin", False):
            return qs
        if tenant_id and hasattr(qs.model, 'tenant_id'):
            return qs.filter(tenant_id=tenant_id)
        return qs"""
                            content = re.sub(r"def get_queryset\(self\):[\s\S]*?(?=\n\s*def|\n\s*class|\Z)", new_qs + "\n", content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

    # process services
    services_dir = os.path.join(app_dir, "services")
    if os.path.exists(services_dir):
        for service_file in os.listdir(services_dir):
            if service_file.endswith(".py") and not service_file.startswith("__"):
                filepath = os.path.join(services_dir, service_file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if "class " in content and "AuditService" not in content:
                    content = "from core.audit.audit_service import AuditService\n" + content
                    
                    # We inject a simple audit call in the methods
                    def inject_audit(match):
                        func_def = match.group(0)
                        func_name = match.group(1)
                        if func_name.startswith("__"): return func_def
                        return func_def + f"\n        AuditService.record('{func_name}', '{app}', 'unknown', {{}}, 'SUCCESS')"
                        
                    content = re.sub(r"def\s+([A-Za-z0-9_]+)\(.*?\):", inject_audit, content)

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
print("Done modifying logic.")
