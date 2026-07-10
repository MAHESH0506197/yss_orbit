from django.urls import path
from .views.error_log_views import ErrorLogListView, ErrorLogDetailView

urlpatterns = [
    path('', ErrorLogListView.as_view(), name='error-log-list'),
    path('<str:pk>/', ErrorLogDetailView.as_view(), name='error-log-detail'),
]
