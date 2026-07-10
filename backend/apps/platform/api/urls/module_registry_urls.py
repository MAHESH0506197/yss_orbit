from django.urls import path
from ..views.module_registry_views import (
    SystemModulesView, SubscribedModulesView, ActivateModuleView, DeactivateModuleView
)

urlpatterns = [
    path('system/', SystemModulesView.as_view(), name='system-modules-list'),
    path('subscribed/', SubscribedModulesView.as_view(), name='subscribed-modules-list'),
    path('<str:module_code>/activate/', ActivateModuleView.as_view(), name='activate-module'),
    path('<str:module_code>/deactivate/', DeactivateModuleView.as_view(), name='deactivate-module'),
]
