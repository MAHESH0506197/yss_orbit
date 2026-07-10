import uuid
import logging
from django.utils import timezone
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

class DataErasureService:
    @staticmethod
    def anonymize_user(user_id: str) -> bool:
        """
        Permanently anonymizes a user's PII fields to satisfy GDPR Right to Erasure.
        This changes their email to a random hash, clears phone numbers, names, etc.,
        and marks the account as soft-deleted.
        """
        User = get_user_model()
        try:
            # We use filter().update() to avoid triggering post_save signals that might
            # require valid emails or sync to third parties, unless required.
            # But we also might want to fetch the user to ensure they exist.
            user_qs = User.objects.filter(id=user_id)
            if not user_qs.exists():
                logger.warning(f"User with id {user_id} not found for anonymization.")
                return False

            random_hash = uuid.uuid4().hex[:8]
            anonymized_email = f"deleted_{random_hash}@deleted.invalid"
            
            # Note: Depending on the custom User model fields, you might need to adapt this.
            # We use a standard set of common fields based on the rulebook.
            update_data = {
                'email': anonymized_email,
                'first_name': 'Deleted',
                'last_name': 'User',
                'is_active': False,
            }
            
            # Some models use 'phone', 'is_deleted', 'deleted_at'. We dynamically check.
            dummy_user = user_qs.first()
            if hasattr(dummy_user, 'phone'):
                update_data['phone'] = ""
            if hasattr(dummy_user, 'phone_number'):
                update_data['phone_number'] = ""
            if hasattr(dummy_user, 'is_deleted'):
                update_data['is_deleted'] = True
            if hasattr(dummy_user, 'deleted_at'):
                update_data['deleted_at'] = timezone.now()

            user_qs.update(**update_data)
            logger.info(f"User {user_id} has been successfully anonymized.")
            return True
        except Exception as e:
            logger.error(f"Error anonymizing user {user_id}: {str(e)}")
            return False

    @staticmethod
    def process_erasure_request(request_id: str) -> bool:
        """
        Processes a DataSubjectRequest for erasure by calling anonymize_user
        and updating the request status.
        """
        from apps.compliance.models import DataSubjectRequest
        try:
            erasure_request = DataSubjectRequest.objects.get(id=request_id, request_type='erasure')
            if erasure_request.status == 'completed':
                return True
                
            erasure_request.status = 'in_progress'
            erasure_request.save(update_fields=['status'])
            
            success = DataErasureService.anonymize_user(erasure_request.user_id)
            
            if success:
                erasure_request.status = 'completed'
                erasure_request.resolved_at = timezone.now()
                erasure_request.save(update_fields=['status', 'resolved_at'])
                return True
            else:
                erasure_request.status = 'rejected'
                erasure_request.details = "Failed to anonymize user data."
                erasure_request.save(update_fields=['status', 'details'])
                return False
        except DataSubjectRequest.DoesNotExist:
            logger.error(f"Erasure request {request_id} not found or not an erasure request.")
            return False
