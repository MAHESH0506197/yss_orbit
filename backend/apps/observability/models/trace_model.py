# yss_orbit\backend\apps\observability\models\trace_model.py
from apps.observability.models.observability_model import RequestTrace

class TraceModel(RequestTrace):
    """
    Alias model for RequestTrace.
    """
    class Meta:
        proxy = True
