from rest_framework.views import APIView
from rest_framework.response import Response
from apps.iam.models.rbac_models import Role
from apps.iam.api.serializers.role_serializer import RoleSerializer
from rest_framework.permissions import IsAuthenticated

class RBACListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        business_unit_id = getattr(request, 'business_unit_id', None)
        if not business_unit_id:
            return Response({"error": "Business unit context required"}, status=400)
        roles = Role.objects.filter(business_unit_id=business_unit_id, is_active=True)
        return Response(RoleSerializer(roles, many=True).data)
