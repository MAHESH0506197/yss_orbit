# yss_orbit\backend\apps\support\views.py
import uuid
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response
from .serializers import TicketSerializer, TicketDetailSerializer, TicketCategorySerializer, TicketCommentSerializer
from .services import SupportService

_service = SupportService()

def _get_bu_id(request: Request) -> uuid.UUID | None:
    bu_str = request.headers.get("X-Business-Unit-ID") or getattr(request.user, "business_unit_id", None)
    if bu_str:
        try:
            return uuid.UUID(str(bu_str))
        except (ValueError, TypeError):
            return None
    return None

class TicketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        filters = {k: v for k, v in request.query_params.items() if k in ["status", "priority", "customer_id", "assigned_to"]}
        tickets = _service.get_tickets(bu_id, filters)
        serializer = TicketSerializer(tickets, many=True)
        return success_response(data=serializer.data, request=request)

    def post(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            created_by_id = getattr(request.user, "id", uuid.uuid4()) # Fallback if user doesn't have ID
            ticket = _service.create_ticket(bu_id, serializer.validated_data, created_by_id)
            return success_response(data=TicketSerializer(ticket).data, status_code=status.HTTP_201_CREATED, request=request)
        return error_response("VALIDATION_ERROR", "Invalid data", details=serializer.errors, http_status=400, request=request)

class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            ticket_id = uuid.UUID(pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid ticket ID.", http_status=400, request=request)

        ticket = _service.get_ticket_detail(bu_id, ticket_id)
        if not ticket:
            return error_response("NOT_FOUND", "Ticket not found.", http_status=404, request=request)
        
        return success_response(data=TicketDetailSerializer(ticket).data, request=request)

    def patch(self, request: Request, pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            ticket_id = uuid.UUID(pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid ticket ID.", http_status=400, request=request)

        # Allow partial updates
        serializer = TicketSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            updated_by_id = getattr(request.user, "id", uuid.uuid4())
            ticket = _service.update_ticket(bu_id, ticket_id, serializer.validated_data, updated_by_id)
            if not ticket:
                return error_response("NOT_FOUND", "Ticket not found.", http_status=404, request=request)
            return success_response(data=TicketDetailSerializer(ticket).data, request=request)
        
        return error_response("VALIDATION_ERROR", "Invalid data", details=serializer.errors, http_status=400, request=request)

class TicketCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        try:
            ticket_id = uuid.UUID(pk)
        except ValueError:
            return error_response("INVALID_ID", "Invalid ticket ID.", http_status=400, request=request)

        serializer = TicketCommentSerializer(data=request.data)
        if serializer.is_valid():
            author_id = getattr(request.user, "id", uuid.uuid4())
            comment = _service.add_comment(bu_id, ticket_id, serializer.validated_data, author_id)
            if not comment:
                return error_response("NOT_FOUND", "Ticket not found.", http_status=404, request=request)
            
            return success_response(data=TicketCommentSerializer(comment).data, status_code=status.HTTP_201_CREATED, request=request)
        return error_response("VALIDATION_ERROR", "Invalid data", details=serializer.errors, http_status=400, request=request)

class TicketCategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id = _get_bu_id(request)
        if not bu_id:
            return error_response("MISSING_BUSINESS_UNIT", "X-Business-Unit-ID header required.", http_status=400, request=request)
        
        categories = _service.get_categories(bu_id)
        serializer = TicketCategorySerializer(categories, many=True)
        return success_response(data=serializer.data, request=request)
