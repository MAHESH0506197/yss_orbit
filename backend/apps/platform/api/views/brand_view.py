# yss_orbit\backend\apps\branding\api\views\brand_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.platform.models import BrandConfiguration
from apps.platform.api.serializers import BrandConfigurationSerializer
from apps.platform.core_permissions import IsAuthenticated

class BrandConfigurationView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        # Allow default branding if no business_unit is bound (e.g. login page)
        try:
            bu_id = request.security_context.require_business_unit()
            brand = BrandConfiguration.objects.filter(business_unit_id=bu_id).first()
        except:
            brand = BrandConfiguration.objects.first()
            
        if not brand:
            brand = BrandConfiguration() # Return unsaved default instance
            
        serializer = BrandConfigurationSerializer(brand)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request):
        bu_id = request.security_context.require_business_unit()
        brand, _ = BrandConfiguration.objects.get_or_create(business_unit_id=bu_id)
        serializer = BrandConfigurationSerializer(brand, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})
