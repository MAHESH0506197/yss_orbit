# yss_orbit\backend\apps\reporting\api\urls.py
from django.urls import path
from .views.analytics_view import AnalyticsAggregationView

urlpatterns = [
    path('analytics/aggregation/', AnalyticsAggregationView.as_view(), name='analytics-aggregation'),
]
