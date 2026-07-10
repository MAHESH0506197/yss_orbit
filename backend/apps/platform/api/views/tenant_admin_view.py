# yss_orbit\backend\apps\platform_admin\api\views\tenant_admin_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response

class TenantAdminView(views.APIView):
    """
    Endpoint for super-admins to trigger tenant-wide administrative actions
    (e.g., force logout all users, rebuild tenant indices).
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, tenant_id, action, *args, **kwargs):
        if action == "force_logout":
            # Mock forcing logout
            return Response({"status": "success", "message": f"All users in tenant {tenant_id} logged out."}, status=status.HTTP_200_OK)
        return Response({"status": "error", "message": "Unknown action."}, status=status.HTTP_400_BAD_REQUEST)
