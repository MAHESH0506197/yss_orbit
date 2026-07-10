# yss_orbit\backend\core\telemetry\metrics.py
"""
Metrics instrumentation wrapper.
"""
import logging

logger = logging.getLogger("metrics")

def record_metric(name: str, value: float, tags: dict = None):
    """
    Record a metric for Prometheus or Datadog.
    """
    logger.info("METRIC", extra={"metric_name": name, "metric_value": value, "metric_tags": tags or {}})
