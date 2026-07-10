# yss_orbit\backend\apps\file_storage\api\views\upload_view.py
from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from apps.platform.models.file_asset_model import FileAsset
from apps.platform.api.serializers.file_storage_serializer import FileAssetSerializer

class FileUploadView(views.APIView):
    """
    API view to securely upload files to the tenant's storage boundary.
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Basic placeholder for actual S3/Azure storage logic
        # Here we just create the metadata record
        is_public = request.data.get('is_public', 'false').lower() == 'true'
        
        file_asset = FileAsset.objects.create(
            original_name=file_obj.name,
            mime_type=file_obj.content_type,
            size_bytes=file_obj.size,
            storage_path=f"tenant_files/{file_obj.name}", # Mocked storage path
            is_public=is_public
        )

        serializer = FileAssetSerializer(file_asset, context={'request': request})
        return Response({
            "status": "success",
            "message": "File uploaded successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)
