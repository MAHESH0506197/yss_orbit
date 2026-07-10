# yss_orbit\backend\core\telemetry\opentelemetry_config.py
"""
OpenTelemetry initialization (placeholder for exact vendor SDK).
"""
import logging

logger = logging.getLogger(__name__)

def setup_opentelemetry(service_name: str):
    logger.info(f"OpenTelemetry configured for {service_name}")
