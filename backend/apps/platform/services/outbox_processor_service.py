# yss_orbit/backend/apps/outbox/services/outbox_processor_service.py
import logging
from django.utils import timezone
from django.db import models
from apps.platform.models import OutboxMessage, OutboxDeadLetter
from apps.platform.models.outbox_model import OutboxStatus
from apps.platform.services.dlq_service import DlqService

logger = logging.getLogger(__name__)

class OutboxProcessorService:
    @classmethod
    def execute(cls, batch_size: int = 50) -> int:
        """
        Fetches PENDING or FAILED (with remaining retries) messages and processes them.
        """
        messages = OutboxMessage.objects.filter(
            status__in=[OutboxStatus.PENDING, OutboxStatus.FAILED],
            retry_count__lt=models.F('max_retries')
        ).order_by('created_at')[:batch_size]

        processed_count = 0
        for message in messages:
            cls.process_message(message)
            processed_count += 1
            
        return processed_count

    @classmethod
    def process_message(cls, message: OutboxMessage):
        message.status = OutboxStatus.PROCESSING
        message.save(update_fields=['status', 'updated_at'])

        try:
            cls.dispatch(message)
            
            message.status = OutboxStatus.PUBLISHED
            message.published_at = timezone.now()
            message.save(update_fields=['status', 'published_at', 'updated_at'])
            
        except Exception as e:
            logger.error(f"Failed to process outbox message {message.id}: {e}")
            message.retry_count += 1
            message.last_error = str(e)
            if message.retry_count >= message.max_retries:
                message.status = OutboxStatus.FAILED
                DlqService.execute(message)
            else:
                message.status = OutboxStatus.FAILED
            message.save(update_fields=['status', 'retry_count', 'last_error', 'updated_at'])

    @classmethod
    def dispatch(cls, message: OutboxMessage):
        """
        Dispatches the event based on message_type or destination.
        For Phase 4, this simulates the routing table. In a fully scaled app, 
        this would either publish to Kafka/RabbitMQ or trigger Celery worker tasks.
        """
        logger.info(f"Dispatching Outbox Message [{message.message_type}] to destination [{message.destination}]")

        if message.destination == "error":
            raise ValueError("Simulated dispatch error")

        if message.message_type == "recruitment.applicant.hired":
            logger.info("ROUTED: Triggering HRMS Onboarding workflow for hired applicant.")
            # e.g., celery_app.send_task("apps.hrms_core.tasks.onboard_new_employee", kwargs=message.payload)

        elif message.message_type == "inventory.adjust_stock.requested":
            logger.info("ROUTED: Triggering Inventory stock adjustment.")
            # e.g., celery_app.send_task("apps.inventory.tasks.process_stock_adjustment", kwargs=message.payload)

        elif message.message_type == "retail_billing.invoice.requested":
            logger.info("ROUTED: Triggering Retail Billing invoice creation.")
            # e.g., celery_app.send_task("apps.retail_billing.tasks.generate_invoice_for_pos", kwargs=message.payload)

        elif message.message_type == "attendance.check_in":
            logger.info("ROUTED: Processing Attendance check_in event downstream.")

        elif message.message_type == "attendance.check_out":
            logger.info("ROUTED: Processing Attendance check_out event downstream.")

        elif message.message_type == "payroll.run.completed":
            logger.info("ROUTED: Triggering Finance GL Sync for completed payroll run.")

        else:
            logger.info(f"No specific route configured for {message.message_type}. Event dropped (or sent to default DLQ).")

        # In this simulation, if we reach here without exception, dispatch is successful.
