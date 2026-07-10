# yss_orbit\backend\apps\pqm\enums\nc_status.py
from django.db import models


class NCStatus(models.TextChoices):
    """
    Full NC status lifecycle per Spec Section 12.
    Every transition is validated by nc_service.transition_status().
    Terminal states: CLOSED, REJECTED, MERGED.
    """
    DRAFT               = "Draft",               "Draft"
    SUBMITTED           = "Submitted",            "Submitted"
    UNDER_REVIEW        = "Under Review",         "Under Review"
    APPROVED            = "Approved",             "Approved"
    REJECTED            = "Rejected",             "Rejected"
    ASSIGNED            = "Assigned",             "Assigned"
    IN_PROGRESS         = "In Progress",          "In Progress"
    RECTIFIED           = "Rectified",            "Rectified"
    VERIFICATION_PENDING = "Verification Pending","Verification Pending"
    APPROVED_FOR_CLOSURE = "Approved for Closure","Approved for Closure"
    REWORK              = "Rework",               "Rework"
    CLOSED              = "Closed",               "Closed"
    REOPENED            = "Reopened",             "Reopened"
    MERGED              = "Merged",               "Merged"

    @classmethod
    def terminal_states(cls) -> set:
        return {cls.CLOSED, cls.REJECTED, cls.MERGED}

    @classmethod
    def editable_states(cls) -> set:
        """States in which NC content can still be PATCH-edited."""
        return {cls.DRAFT, cls.REJECTED}

    @classmethod
    def allowed_transitions(cls) -> dict:
        """
        State machine as defined in Spec Section 12.
        Key = current status, Value = set of allowed next statuses.
        All transitions go through nc_service.transition_status() — never direct field writes.
        """
        return {
            cls.DRAFT:               {cls.SUBMITTED},
            cls.SUBMITTED:           {cls.UNDER_REVIEW},
            cls.UNDER_REVIEW:        {cls.APPROVED, cls.REJECTED},
            cls.REJECTED:            {cls.DRAFT},
            cls.APPROVED:            {cls.ASSIGNED},
            cls.ASSIGNED:            {cls.IN_PROGRESS},
            cls.IN_PROGRESS:         {cls.RECTIFIED},
            cls.RECTIFIED:           {cls.VERIFICATION_PENDING},
            cls.VERIFICATION_PENDING: {cls.APPROVED_FOR_CLOSURE, cls.REWORK},
            cls.REWORK:              {cls.ASSIGNED},
            cls.APPROVED_FOR_CLOSURE:{cls.CLOSED},
            cls.CLOSED:              {cls.REOPENED},
            cls.REOPENED:            {cls.ASSIGNED},
            # MERGED is terminal — no allowed transitions
            cls.MERGED:              set(),
        }
