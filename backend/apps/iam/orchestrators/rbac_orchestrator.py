# yss_orbit\backend\apps\rbac\orchestrators\rbac_orchestrator.py
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

class RbacOrchestrator:
    @transaction.atomic
    def assign_role(self, user, role):
        logger.info(f"Assigning role {role} to user {user}")
        # Call repositories and services
        return True

    @transaction.atomic
    def revoke_role(self, user, role):
        logger.info(f"Revoking role {role} from user {user}")
        return True
