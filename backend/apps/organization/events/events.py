# apps/organization/events/events.py
"""
YSS Orbit — Organization Module Event Signals

Django signals for the full Organization lifecycle.
These signals are fired by OrganizationService on every state transition.
Event handlers are registered in apps.py → ready() via event_handlers.py.

NOTE: This file previously contained membership-related event dataclasses,
which have been moved to their proper location.
"""
from django.dispatch import Signal

# ─── Organization Signals ──────────────────────────────────────────────────────
organization_created             = Signal()  # kwargs: org
organization_updated             = Signal()  # kwargs: org
organization_deleted             = Signal()  # kwargs: org
organization_restored            = Signal()  # kwargs: org
organization_permanently_deleted = Signal()  # kwargs: org_id, org_name

# ─── BusinessDomain Signals ───────────────────────────────────────────────────
business_domain_created             = Signal()  # kwargs: domain
business_domain_updated             = Signal()  # kwargs: domain
business_domain_deleted             = Signal()  # kwargs: domain
business_domain_restored            = Signal()  # kwargs: domain
business_domain_permanently_deleted = Signal()  # kwargs: domain_id, domain_name

# ─── BusinessUnit Signals ─────────────────────────────────────────────────────
# C-04 FIX: All BU signals are sent with `bu=<instance>` (NOT `business_unit=`).
# Handlers must use: kwargs.get('bu') or sender/bu kwargs.
# Example: def handler(sender, bu, **kwargs): ...
business_unit_created  = Signal()  # kwargs: bu (BusinessUnit instance)
business_unit_updated  = Signal()  # kwargs: bu (BusinessUnit instance)
business_unit_deleted  = Signal()  # kwargs: bu (BusinessUnit instance, after soft-delete)
business_unit_restored = Signal()  # kwargs: bu (BusinessUnit instance)

# ─── Membership Event Dataclasses (UBU lifecycle) ─────────────────────────────
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class MembershipCreatedEvent:
    membership_id: str
    user_id: str
    business_unit_id: str
    role: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MembershipUpdatedEvent:
    membership_id: str
    user_id: str
    business_unit_id: str
    updated_fields: list = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MembershipDeactivatedEvent:
    membership_id: str
    user_id: str
    business_unit_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MembershipTransferredEvent:
    old_membership_id: str
    new_membership_id: str
    user_id: str
    old_business_unit_id: str
    new_business_unit_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)
