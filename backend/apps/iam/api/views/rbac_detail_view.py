from rest_framework.views import APIView
from rest_framework.response import Response
from apps.iam.models.rbac_models import Role
from apps.iam.api.serializers.role_serializer import RoleSerializer
from rest_framework.permissions import IsAuthenticated

class RBACDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, *args, **kwargs):
        role = Role.objects.filter(pk=pk, is_active=True).first()
        if not role:
            return Response({"error": "Role not found"}, status=404)
        return Response(RoleSerializer(role).data)
