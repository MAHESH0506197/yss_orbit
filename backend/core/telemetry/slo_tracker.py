# yss_orbit\backend\core\telemetry\slo_tracker.py
"""
Service Level Objective tracker.
"""
import time
from contextlib import contextmanager
from .metrics import record_metric

@contextmanager
def track_latency(operation_name: str, tags: dict = None):
    start = time.perf_counter()
    try:
        yield
    finally:
        duration_ms = (time.perf_counter() - start) * 1000
        record_metric(f"{operation_name}_latency_ms", duration_ms, tags)
