# yss_orbit\backend\apps\support\services.py
import uuid
from typing import List, Optional, Dict, Any
from django.utils import timezone
from .models import Ticket, TicketCategory, TicketComment, TicketAttachment
from django.db.models import QuerySet

class SupportService:
    def get_tickets(self, bu_id: uuid.UUID, filters: Optional[Dict[str, Any]] = None) -> QuerySet[Ticket]:
        queryset = Ticket.objects.filter(business_unit_id=bu_id)
        if filters:
            if "status" in filters:
                queryset = queryset.filter(status=filters["status"])
            if "priority" in filters:
                queryset = queryset.filter(priority=filters["priority"])
            if "customer_id" in filters:
                queryset = queryset.filter(customer_id=filters["customer_id"])
            if "assigned_to" in filters:
                queryset = queryset.filter(assigned_to=filters["assigned_to"])
        return queryset

    def create_ticket(self, bu_id: uuid.UUID, data: Dict[str, Any], created_by_id: uuid.UUID) -> Ticket:
        data["business_unit_id"] = bu_id
        data["created_by_id"] = created_by_id
        return Ticket.objects.create(**data)

    def get_ticket_detail(self, bu_id: uuid.UUID, ticket_id: uuid.UUID) -> Optional[Ticket]:
        return Ticket.objects.filter(business_unit_id=bu_id, id=ticket_id).first()

    def update_ticket(self, bu_id: uuid.UUID, ticket_id: uuid.UUID, data: Dict[str, Any], updated_by_id: uuid.UUID) -> Optional[Ticket]:
        ticket = self.get_ticket_detail(bu_id, ticket_id)
        if not ticket:
            return None
        
        for key, value in data.items():
            setattr(ticket, key, value)
        
        if "status" in data and data["status"] in [Ticket.Status.RESOLVED, Ticket.Status.CLOSED] and not ticket.resolved_at:
            ticket.resolved_at = timezone.now()
            
        ticket.updated_by_id = updated_by_id
        ticket.save()
        return ticket

    def add_comment(self, bu_id: uuid.UUID, ticket_id: uuid.UUID, data: Dict[str, Any], author_id: uuid.UUID) -> Optional[TicketComment]:
        ticket = self.get_ticket_detail(bu_id, ticket_id)
        if not ticket:
            return None
            
        data["business_unit_id"] = bu_id
        data["ticket"] = ticket
        data["author_id"] = author_id
        data["created_by_id"] = author_id
        
        return TicketComment.objects.create(**data)

    def get_categories(self, bu_id: uuid.UUID) -> QuerySet[TicketCategory]:
        return TicketCategory.objects.filter(business_unit_id=bu_id, is_active_category=True)
