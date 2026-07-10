from rest_framework.views import APIView
from rest_framework.response import Response
from apps.iam.services.rbac_service import RBACService
from rest_framework.permissions import IsAuthenticated

class RBACContextView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        business_unit_id = getattr(request, 'business_unit_id', None)
        if not business_unit_id:
            return Response({"permissions": []})
        perms = RBACService.get_user_permissions_as_frozenset(request.user.id, business_unit_id)
        return Response({"permissions": list(perms)})
