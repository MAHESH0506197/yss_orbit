from django.urls import path
from ..views.feature_flag_views import FeatureFlagListView, FeatureFlagEvaluateView, FeatureFlagBulkEvaluateView

urlpatterns = [
    path('', FeatureFlagListView.as_view(), name='feature-flag-list'),
    path('evaluate/', FeatureFlagEvaluateView.as_view(), name='feature-flag-evaluate'),
    path('bulk-evaluate/', FeatureFlagBulkEvaluateView.as_view(), name='feature-flag-bulk-evaluate'),
]
