import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.http import HttpResponse

from rest_framework.permissions import IsAuthenticated
from apps.hrms.models.employee_import_session import EmployeeImportSession
from apps.hrms.services.employee_import_service import EmployeeImportService
from apps.hrms.api.views.utils import _require_bu

class EmployeeImportTemplateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bu_id, err = _require_bu(request)
        if err: return err
        excel_bytes = EmployeeImportService.generate_template(bu_id)
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="Employee_Import_Template.xlsx"'
        return response

class EmployeeImportUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        bu_id, err = _require_bu(request)
        if err: return err
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith(".xlsx"):
            return Response({"detail": "Only .xlsx files are supported."}, status=status.HTTP_400_BAD_REQUEST)

        session = EmployeeImportSession.objects.create(
            business_unit_id=bu_id,
            uploaded_by=request.user,
            file_path=file,
            original_file_name=file.name,
            status=EmployeeImportSession.Status.UPLOADED
        )
        
        return Response({"session_id": str(session.id)}, status=status.HTTP_201_CREATED)

class EmployeeImportValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        bu_id, err = _require_bu(request)
        if err: return err
        try:
            session = EmployeeImportSession.objects.get(id=session_id, business_unit_id=bu_id)
        except EmployeeImportSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        EmployeeImportService.validate_session(session)
        
        return Response({
            "status": session.status,
            "total_rows": session.total_rows,
            "valid_rows": session.valid_rows,
            "error_rows": session.error_rows,
            "error_grid": session.error_grid
        })

class EmployeeImportExecuteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        bu_id, err = _require_bu(request)
        if err: return err
        try:
            session = EmployeeImportSession.objects.get(id=session_id, business_unit_id=bu_id)
        except EmployeeImportSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            EmployeeImportService.execute_session(session)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "status": session.status,
            "imported_count": session.valid_rows
        })

class EmployeeImportErrorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        bu_id, err = _require_bu(request)
        if err: return err
        try:
            session = EmployeeImportSession.objects.get(id=session_id, business_unit_id=bu_id)
        except EmployeeImportSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        excel_bytes = EmployeeImportService.generate_error_report(session)
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="Employee_Import_Errors.xlsx"'
        return response

class EmployeeImportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bu_id, err = _require_bu(request)
        if err: return err
        qs = EmployeeImportSession.objects.filter(business_unit_id=bu_id).select_related("uploaded_by")[:50]
        
        data = []
        for s in qs:
            data.append({
                "id": str(s.id),
                "file_name": s.original_file_name,
                "status": s.status,
                "total_rows": s.total_rows,
                "valid_rows": s.valid_rows,
                "error_rows": s.error_rows,
                "created_at": s.created_at,
                "uploaded_by_name": f"{s.uploaded_by.first_name} {s.uploaded_by.last_name}" if s.uploaded_by else "Unknown"
            })
            
        return Response(data)
