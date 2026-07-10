# yss_orbit\backend\apps\observability\selectors\observability_selectors.py
from apps.observability.models.observability_model import RequestTrace
from django.db.models import QuerySet

class ObservabilitySelectors:
    """
    Selector logic for observability data.
    """
    @staticmethod
    def get_slow_traces(threshold_ms: float = 1000) -> QuerySet[RequestTrace]:
        return RequestTrace.objects.filter(duration_ms__gte=threshold_ms).order_by('-duration_ms')
