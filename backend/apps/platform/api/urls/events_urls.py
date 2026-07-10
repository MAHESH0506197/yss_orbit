# yss_orbit\backend\apps\events\urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import EventOutboxViewSet, EventDeadLetterViewSet, ProcessedEventViewSet

router = DefaultRouter()
router.register(r'outbox', EventOutboxViewSet, basename='event_outbox')
router.register(r'dead-letters', EventDeadLetterViewSet, basename='event_dead_letter')
router.register(r'processed', ProcessedEventViewSet, basename='processed_event')

urlpatterns = [
    path('', include(router.urls)),
]
