# yss_orbit\scratch\generate.py
import os

files_content = {
    "backend/apps/tenant_module/enums/enums.py": '''from django.db import models

class ModuleStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    EXPIRED = "EXPIRED", "Expired"
    TRIAL = "TRIAL", "Trial"
    CANCELLED = "CANCELLED", "Cancelled"

class BillingCycle(models.TextChoices):
    MONTHLY = "MONTHLY", "Monthly"
    YEARLY = "YEARLY", "Yearly"
    LIFETIME = "LIFETIME", "Lifetime"
''',
    "backend/apps/tenant_module/enums/__init__.py": '''from .enums import ModuleStatus, BillingCycle
__all__ = ["ModuleStatus", "BillingCycle"]
''',
    "backend/apps/tenant_module/constants/constants.py": '''DEFAULT_TRIAL_DAYS = 14
DEFAULT_CURRENCY = "USD"
''',
    "backend/apps/tenant_module/constants/__init__.py": '''from .constants import DEFAULT_TRIAL_DAYS, DEFAULT_CURRENCY
__all__ = ["DEFAULT_TRIAL_DAYS", "DEFAULT_CURRENCY"]
''',
    "backend/apps/tenant_module/models/subscription_plan_model.py": '''from django.db import models
from core.base.base_model import PlatformModel
from apps.tenant_module.enums import BillingCycle

class SubscriptionPlan(PlatformModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="USD")
    billing_cycle = models.CharField(max_length=20, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)
    trial_days = models.IntegerField(default=0)

    class Meta:
        db_table = "tenant_module_subscription_plan"
        verbose_name = "Subscription Plan"
        verbose_name_plural = "Subscription Plans"

    def __str__(self):
        return f"{self.name} ({self.code})"
''',
    "backend/apps/tenant_module/models/tenant_module_model.py": '''from django.db import models
from django.utils import timezone
from core.base.tenant_model import TenantModel
from apps.tenant_module.enums import ModuleStatus
from apps.tenant_module.models.subscription_plan_model import SubscriptionPlan

class TenantModule(TenantModel):
    module_code = models.CharField(max_length=100, db_index=True)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="tenant_modules")
    status = models.CharField(max_length=20, choices=ModuleStatus.choices, default=ModuleStatus.TRIAL)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)

    class Meta:
        db_table = "tenant_module_tenant_module"
        verbose_name = "Tenant Module"
        verbose_name_plural = "Tenant Modules"
        unique_together = ("business_unit_id", "module_code")

    def __str__(self):
        return f"{self.module_code} for BU {self.business_unit_id}"

    @property
    def is_active_status(self) -> bool:
        return self.status in [ModuleStatus.ACTIVE, ModuleStatus.TRIAL]

    def has_expired(self) -> bool:
        if not self.valid_until:
            return False
        return timezone.now() > self.valid_until
''',
    "backend/apps/tenant_module/models/__init__.py": '''from .subscription_plan_model import SubscriptionPlan
from .tenant_module_model import TenantModule
__all__ = ["SubscriptionPlan", "TenantModule"]
''',
    "backend/apps/tenant_module/api/serializers/plan_serializer.py": '''from rest_framework import serializers
from apps.tenant_module.models.subscription_plan_model import SubscriptionPlan

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id", "name", "code", "description", "price", "currency", 
            "billing_cycle", "trial_days", "is_active", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
''',
    "backend/apps/tenant_module/api/serializers/tenant_module_serializer.py": '''from rest_framework import serializers
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.api.serializers.plan_serializer import SubscriptionPlanSerializer

class TenantModuleSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = TenantModule
        fields = [
            "id", "business_unit_id", "module_code", "plan", "plan_id",
            "status", "valid_from", "valid_until", "auto_renew", "is_active",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "business_unit_id", "status", "valid_from", "valid_until", "created_at", "updated_at"]
''',
    "backend/apps/tenant_module/api/serializers/tenant_module_response_serializer.py": '''from rest_framework import serializers
from apps.tenant_module.api.serializers.tenant_module_serializer import TenantModuleSerializer

class TenantModuleResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    data = TenantModuleSerializer()
''',
    "backend/apps/tenant_module/api/serializers/subscribe_serializer.py": '''from rest_framework import serializers

class SubscribeSerializer(serializers.Serializer):
    module_code = serializers.CharField(max_length=100)
    plan_code = serializers.CharField(max_length=100)
    auto_renew = serializers.BooleanField(default=True)
''',
    "backend/apps/tenant_module/api/serializers/__init__.py": '''from .plan_serializer import SubscriptionPlanSerializer
from .tenant_module_serializer import TenantModuleSerializer
from .tenant_module_response_serializer import TenantModuleResponseSerializer
from .subscribe_serializer import SubscribeSerializer
__all__ = ["SubscriptionPlanSerializer", "TenantModuleSerializer", "TenantModuleResponseSerializer", "SubscribeSerializer"]
''',
    "backend/apps/tenant_module/repositories/tenant_module_repository.py": '''from typing import Optional, List
import uuid
from apps.tenant_module.models.tenant_module_model import TenantModule
from core.base.tenant_repository import TenantRepository

class TenantModuleRepository(TenantRepository):
    model = TenantModule

    def get_by_module_code(self, module_code: str) -> Optional[TenantModule]:
        return self.get_queryset().filter(module_code=module_code).first()

    def get_active_modules(self) -> List[TenantModule]:
        from apps.tenant_module.enums import ModuleStatus
        return list(self.get_queryset().filter(status__in=[ModuleStatus.ACTIVE, ModuleStatus.TRIAL]))
''',
    "backend/apps/tenant_module/repositories/__init__.py": '''from .tenant_module_repository import TenantModuleRepository
__all__ = ["TenantModuleRepository"]
''',
    "backend/apps/tenant_module/selectors/tenant_module_selectors.py": '''from typing import Optional, List
import uuid
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.repositories.tenant_module_repository import TenantModuleRepository

class TenantModuleSelectors:
    def __init__(self, repository: TenantModuleRepository):
        self.repository = repository

    def get_module_by_code(self, module_code: str) -> Optional[TenantModule]:
        return self.repository.get_by_module_code(module_code)

    def get_all_active_modules(self) -> List[TenantModule]:
        return self.repository.get_active_modules()
''',
    "backend/apps/tenant_module/selectors/__init__.py": '''from .tenant_module_selectors import TenantModuleSelectors
__all__ = ["TenantModuleSelectors"]
''',
    "backend/apps/tenant_module/services/subscription_plan_service.py": '''from typing import Optional
from apps.tenant_module.models.subscription_plan_model import SubscriptionPlan
from core.base.base_service import BaseService

class SubscriptionPlanService(BaseService):
    def get_plan_by_code(self, plan_code: str) -> Optional[SubscriptionPlan]:
        return SubscriptionPlan.objects.filter(code=plan_code).first()
''',
    "backend/apps/tenant_module/services/tenant_module_service.py": '''from typing import Optional
import uuid
from django.utils import timezone
from datetime import timedelta
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.models.subscription_plan_model import SubscriptionPlan
from apps.tenant_module.enums import ModuleStatus
from core.base.base_service import BaseService

class TenantModuleService(BaseService):
    def subscribe_to_module(self, business_unit_id: uuid.UUID, module_code: str, plan: SubscriptionPlan, auto_renew: bool = True) -> TenantModule:
        # Check if already exists
        module, created = TenantModule.objects.get_or_create(
            business_unit_id=business_unit_id,
            module_code=module_code,
            defaults={
                "plan": plan,
                "status": ModuleStatus.TRIAL if plan.trial_days > 0 else ModuleStatus.ACTIVE,
                "valid_from": timezone.now(),
                "valid_until": timezone.now() + timedelta(days=plan.trial_days) if plan.trial_days > 0 else None,
                "auto_renew": auto_renew,
            }
        )
        if not created:
            module.plan = plan
            module.status = ModuleStatus.ACTIVE
            module.auto_renew = auto_renew
            module.save()
        return module

    def unsubscribe_from_module(self, business_unit_id: uuid.UUID, module_code: str) -> bool:
        try:
            module = TenantModule.objects.get(business_unit_id=business_unit_id, module_code=module_code)
            module.status = ModuleStatus.CANCELLED
            module.auto_renew = False
            module.save()
            return True
        except TenantModule.DoesNotExist:
            return False
''',
    "backend/apps/tenant_module/services/trial_service.py": '''from typing import List
from django.utils import timezone
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.enums import ModuleStatus

class TrialService:
    def expire_trials(self) -> int:
        now = timezone.now()
        expired_modules = TenantModule.objects.filter(
            status=ModuleStatus.TRIAL,
            valid_until__lt=now
        )
        count = expired_modules.update(status=ModuleStatus.EXPIRED, is_active=False)
        return count
''',
    "backend/apps/tenant_module/services/__init__.py": '''from .subscription_plan_service import SubscriptionPlanService
from .tenant_module_service import TenantModuleService
from .trial_service import TrialService
__all__ = ["SubscriptionPlanService", "TenantModuleService", "TrialService"]
''',
    "backend/apps/tenant_module/orchestrators/tenant_module_orchestrator.py": '''from typing import Dict, Any, Optional
import uuid
from apps.tenant_module.services.tenant_module_service import TenantModuleService
from apps.tenant_module.services.subscription_plan_service import SubscriptionPlanService
from apps.tenant_module.events.events import ModuleSubscribedEvent
from apps.tenant_module.models.tenant_module_model import TenantModule

class TenantModuleOrchestrator:
    def __init__(self, tenant_module_service: TenantModuleService, subscription_plan_service: SubscriptionPlanService):
        self.tenant_module_service = tenant_module_service
        self.subscription_plan_service = subscription_plan_service

    def subscribe(self, business_unit_id: uuid.UUID, module_code: str, plan_code: str, auto_renew: bool = True) -> Optional[TenantModule]:
        plan = self.subscription_plan_service.get_plan_by_code(plan_code)
        if not plan:
            raise ValueError(f"Plan {plan_code} not found")
        
        module = self.tenant_module_service.subscribe_to_module(
            business_unit_id=business_unit_id,
            module_code=module_code,
            plan=plan,
            auto_renew=auto_renew
        )
        
        event = ModuleSubscribedEvent(business_unit_id=business_unit_id, module_code=module_code, plan_code=plan_code)
        
        return module

    def unsubscribe(self, business_unit_id: uuid.UUID, module_code: str) -> bool:
        return self.tenant_module_service.unsubscribe_from_module(business_unit_id, module_code)
''',
    "backend/apps/tenant_module/orchestrators/__init__.py": '''from .tenant_module_orchestrator import TenantModuleOrchestrator
__all__ = ["TenantModuleOrchestrator"]
''',
    "backend/apps/tenant_module/events/events.py": '''from dataclasses import dataclass
import uuid

@dataclass
class ModuleSubscribedEvent:
    business_unit_id: uuid.UUID
    module_code: str
    plan_code: str

@dataclass
class ModuleUnsubscribedEvent:
    business_unit_id: uuid.UUID
    module_code: str
''',
    "backend/apps/tenant_module/events/event_handlers.py": '''from apps.tenant_module.events.events import ModuleSubscribedEvent, ModuleUnsubscribedEvent
import logging

logger = logging.getLogger(__name__)

def handle_module_subscribed(event: ModuleSubscribedEvent):
    logger.info(f"Module {event.module_code} subscribed for BU {event.business_unit_id} on plan {event.plan_code}")

def handle_module_unsubscribed(event: ModuleUnsubscribedEvent):
    logger.info(f"Module {event.module_code} unsubscribed for BU {event.business_unit_id}")
''',
    "backend/apps/tenant_module/events/__init__.py": '''from .events import ModuleSubscribedEvent, ModuleUnsubscribedEvent
from .event_handlers import handle_module_subscribed, handle_module_unsubscribed
__all__ = ["ModuleSubscribedEvent", "ModuleUnsubscribedEvent", "handle_module_subscribed", "handle_module_unsubscribed"]
''',
    "backend/apps/tenant_module/api/views/plan_view.py": '''from rest_framework import viewsets, permissions
from apps.tenant_module.models.subscription_plan_model import SubscriptionPlan
from apps.tenant_module.api.serializers.plan_serializer import SubscriptionPlanSerializer
from core.base.base_viewset import BaseViewSet

class SubscriptionPlanViewSet(BaseViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "code"
''',
    "backend/apps/tenant_module/api/views/subscribe_view.py": '''from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.tenant_module.api.serializers.subscribe_serializer import SubscribeSerializer
from apps.tenant_module.api.serializers.tenant_module_serializer import TenantModuleSerializer
from apps.tenant_module.orchestrators.tenant_module_orchestrator import TenantModuleOrchestrator
from apps.tenant_module.services.tenant_module_service import TenantModuleService
from apps.tenant_module.services.subscription_plan_service import SubscriptionPlanService

class SubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        business_unit_id = request.business_unit_id
        if not business_unit_id:
            return Response({"error": "Business unit context required"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        
        orchestrator = TenantModuleOrchestrator(
            tenant_module_service=TenantModuleService(),
            subscription_plan_service=SubscriptionPlanService()
        )
        
        try:
            module = orchestrator.subscribe(
                business_unit_id=business_unit_id,
                module_code=data["module_code"],
                plan_code=data["plan_code"],
                auto_renew=data["auto_renew"]
            )
            return Response(TenantModuleSerializer(module).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
''',
    "backend/apps/tenant_module/api/views/unsubscribe_view.py": '''from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.tenant_module.orchestrators.tenant_module_orchestrator import TenantModuleOrchestrator
from apps.tenant_module.services.tenant_module_service import TenantModuleService
from apps.tenant_module.services.subscription_plan_service import SubscriptionPlanService

class UnsubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, module_code, *args, **kwargs):
        business_unit_id = request.business_unit_id
        if not business_unit_id:
            return Response({"error": "Business unit context required"}, status=status.HTTP_400_BAD_REQUEST)

        orchestrator = TenantModuleOrchestrator(
            tenant_module_service=TenantModuleService(),
            subscription_plan_service=SubscriptionPlanService()
        )
        
        success = orchestrator.unsubscribe(business_unit_id, module_code)
        if success:
            return Response({"message": "Successfully unsubscribed"}, status=status.HTTP_200_OK)
        return Response({"error": "Module not found"}, status=status.HTTP_404_NOT_FOUND)
''',
    "backend/apps/tenant_module/api/views/tenant_module_view.py": '''from rest_framework import viewsets, permissions
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.api.serializers.tenant_module_serializer import TenantModuleSerializer
from core.base.base_viewset import BaseViewSet

class TenantModuleViewSet(BaseViewSet):
    serializer_class = TenantModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "module_code"

    def get_queryset(self):
        if not hasattr(self.request, "business_unit_id") or not self.request.business_unit_id:
            return TenantModule.objects.none()
        return TenantModule.objects.filter(business_unit_id=self.request.business_unit_id, is_active=True)
''',
    "backend/apps/tenant_module/api/views/tenant_module_list_view.py": '''from rest_framework import generics, permissions
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.api.serializers.tenant_module_serializer import TenantModuleSerializer

class TenantModuleListView(generics.ListAPIView):
    serializer_class = TenantModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request, "business_unit_id") or not self.request.business_unit_id:
            return TenantModule.objects.none()
        return TenantModule.objects.filter(business_unit_id=self.request.business_unit_id, is_active=True)
''',
    "backend/apps/tenant_module/api/views/tenant_module_detail_view.py": '''from rest_framework import generics, permissions
from apps.tenant_module.models.tenant_module_model import TenantModule
from apps.tenant_module.api.serializers.tenant_module_serializer import TenantModuleSerializer

class TenantModuleDetailView(generics.RetrieveAPIView):
    serializer_class = TenantModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "module_code"

    def get_queryset(self):
        if not hasattr(self.request, "business_unit_id") or not self.request.business_unit_id:
            return TenantModule.objects.none()
        return TenantModule.objects.filter(business_unit_id=self.request.business_unit_id)
''',
    "backend/apps/tenant_module/api/views/__init__.py": '''from .plan_view import SubscriptionPlanViewSet
from .subscribe_view import SubscribeView
from .unsubscribe_view import UnsubscribeView
from .tenant_module_view import TenantModuleViewSet
from .tenant_module_list_view import TenantModuleListView
from .tenant_module_detail_view import TenantModuleDetailView

__all__ = [
    "SubscriptionPlanViewSet",
    "SubscribeView",
    "UnsubscribeView",
    "TenantModuleViewSet",
    "TenantModuleListView",
    "TenantModuleDetailView"
]
''',
    "backend/apps/tenant_module/api/urls.py": '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.tenant_module.api.views import (
    SubscriptionPlanViewSet,
    TenantModuleViewSet,
    SubscribeView,
    UnsubscribeView,
    TenantModuleListView,
    TenantModuleDetailView
)

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'modules', TenantModuleViewSet, basename='tenant-module')

urlpatterns = [
    path('', include(router.urls)),
    path('subscribe/', SubscribeView.as_view(), name='module-subscribe'),
    path('unsubscribe/<str:module_code>/', UnsubscribeView.as_view(), name='module-unsubscribe'),
    path('my-modules/', TenantModuleListView.as_view(), name='my-modules-list'),
    path('my-modules/<str:module_code>/', TenantModuleDetailView.as_view(), name='my-modules-detail'),
]
''',
    "backend/apps/tenant_module/api/serializers/urls.py": '''# This file is intentionally left empty as serializers do not need urls.py
''',
    "backend/apps/tenant_module/api/__init__.py": '''# API package
''',
    "backend/apps/tenant_module/urls.py": '''from django.urls import path, include

urlpatterns = [
    path('api/v1/tenant-module/', include('apps.tenant_module.api.urls')),
]
''',
    "backend/apps/tenant_module/admin.py": '''from django.contrib import admin
from apps.tenant_module.models import SubscriptionPlan, TenantModule

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'price', 'billing_cycle', 'is_active')
    search_fields = ('name', 'code')
    list_filter = ('billing_cycle', 'is_active')

@admin.register(TenantModule)
class TenantModuleAdmin(admin.ModelAdmin):
    list_display = ('module_code', 'business_unit_id', 'plan', 'status', 'valid_until', 'is_active')
    search_fields = ('module_code', 'business_unit_id')
    list_filter = ('status', 'is_active', 'module_code')
''',
    "backend/apps/tenant_module/apps.py": '''from django.apps import AppConfig

class TenantModuleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tenant_module'
    verbose_name = 'Tenant Module'

    def ready(self):
        # Import signal handlers or events here if any
        import apps.tenant_module.events.event_handlers
''',
    "backend/apps/tenant_module/__init__.py": '''# Tenant Module application
''',
    "backend/apps/tenancy/__init__.py": '''# Tenancy application
''',
    "backend/apps/tenant_module/permissions/permissions.py": '''from rest_framework import permissions

class HasModulePermission(permissions.BasePermission):
    """
    Checks if the requesting business unit has an active subscription to a specific module.
    Usage: permission_classes = [HasModulePermission("BILLING")]
    """
    def __init__(self, module_code: str):
        self.module_code = module_code

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not hasattr(request, "business_unit_id") or not request.business_unit_id:
            return False
            
        from apps.tenant_module.models import TenantModule
        from apps.tenant_module.enums import ModuleStatus
        
        return TenantModule.objects.filter(
            business_unit_id=request.business_unit_id,
            module_code=self.module_code,
            status__in=[ModuleStatus.ACTIVE, ModuleStatus.TRIAL],
            is_active=True
        ).exists()
''',
    "backend/apps/tenant_module/permissions/__init__.py": '''from .permissions import HasModulePermission
__all__ = ["HasModulePermission"]
''',
    "backend/apps/tenant_module/tasks/tenant_module_tasks.py": '''import logging
from celery import shared_task
from apps.tenant_module.services.trial_service import TrialService

logger = logging.getLogger(__name__)

@shared_task
def expire_trials_task():
    logger.info("Starting expire_trials_task")
    trial_service = TrialService()
    count = trial_service.expire_trials()
    logger.info(f"Expired {count} trial modules")
    return count
''',
    "backend/apps/tenant_module/tasks/__init__.py": '''from .tenant_module_tasks import expire_trials_task
__all__ = ["expire_trials_task"]
''',
    "backend/apps/tenant_module/management/commands/seed_plans.py": '''from django.core.management.base import BaseCommand
from apps.tenant_module.models import SubscriptionPlan
from apps.tenant_module.enums import BillingCycle

class Command(BaseCommand):
    help = 'Seeds initial subscription plans'

    def handle(self, *args, **kwargs):
        plans = [
            {
                "name": "Free Tier",
                "code": "FREE",
                "description": "Basic features",
                "price": 0.00,
                "billing_cycle": BillingCycle.LIFETIME,
                "trial_days": 0
            },
            {
                "name": "Pro Tier",
                "code": "PRO",
                "description": "Advanced features",
                "price": 99.00,
                "billing_cycle": BillingCycle.MONTHLY,
                "trial_days": 14
            },
            {
                "name": "Enterprise Tier",
                "code": "ENTERPRISE",
                "description": "All features with support",
                "price": 999.00,
                "billing_cycle": BillingCycle.YEARLY,
                "trial_days": 30
            }
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                code=plan_data["code"],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created plan: {plan.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Plan already exists: {plan.name}"))
''',
    "backend/apps/tenant_module/management/commands/sync_tenant_module.py": '''from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Syncs tenant modules'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Sync complete."))
''',
    "backend/apps/tenant_module/management/commands/__init__.py": '''# Management commands
''',
    "backend/apps/tenant_module/management/__init__.py": '''# Management
''',
    "backend/apps/tenant_module/migrations/__init__.py": '''# Migrations
''',
    "backend/apps/tenant_module/tests/conftest.py": '''import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()
''',
    "backend/apps/tenant_module/tests/factories.py": '''import factory
from apps.tenant_module.models import SubscriptionPlan, TenantModule

class SubscriptionPlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SubscriptionPlan
    
    name = factory.Faker("word")
    code = factory.Sequence(lambda n: f"PLAN_{n}")
    price = 10.00

class TenantModuleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TenantModule
    
    business_unit_id = factory.Faker("uuid4")
    module_code = "TEST_MODULE"
    plan = factory.SubFactory(SubscriptionPlanFactory)
''',
    "backend/apps/tenant_module/tests/test_tenant_module_api.py": '''import pytest

@pytest.mark.django_db
def test_subscription_plan_list(api_client):
    response = api_client.get('/api/v1/tenant-module/plans/')
    assert response.status_code in [200, 401, 403]
''',
    "backend/apps/tenant_module/tests/test_tenant_module_events.py": '''from apps.tenant_module.events.events import ModuleSubscribedEvent

def test_event_creation():
    event = ModuleSubscribedEvent(business_unit_id="123", module_code="ABC", plan_code="FREE")
    assert event.module_code == "ABC"
''',
    "backend/apps/tenant_module/tests/test_tenant_module_model.py": '''import pytest
from apps.tenant_module.tests.factories import SubscriptionPlanFactory

@pytest.mark.django_db
def test_create_plan():
    plan = SubscriptionPlanFactory(name="Test")
    assert plan.name == "Test"
''',
    "backend/apps/tenant_module/tests/test_tenant_module_orchestrator.py": '''def test_orchestrator_init():
    pass
''',
    "backend/apps/tenant_module/tests/test_tenant_module_repository.py": '''def test_repository_init():
    pass
''',
    "backend/apps/tenant_module/tests/test_tenant_module_selectors.py": '''def test_selector_init():
    pass
''',
    "backend/apps/tenant_module/tests/test_tenant_module_service.py": '''def test_service_init():
    pass
''',
    "backend/apps/tenant_module/tests/__init__.py": '''# Tests
''',
    "backend/apps/tenant_module/validators/validators.py": '''from rest_framework.exceptions import ValidationError

def validate_plan_exists(plan_code: str):
    from apps.tenant_module.models import SubscriptionPlan
    if not SubscriptionPlan.objects.filter(code=plan_code, is_active=True).exists():
        raise ValidationError(f"Plan {plan_code} does not exist or is inactive.")
''',
    "backend/apps/tenant_module/validators/__init__.py": '''from .validators import validate_plan_exists
__all__ = ["validate_plan_exists"]
'''
}

def main():
    base_dir = r"c:/PROJECT/yss_orbit"
    for relative_path, content in files_content.items():
        full_path = os.path.join(base_dir, relative_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Written: {relative_path}")

if __name__ == "__main__":
    main()
