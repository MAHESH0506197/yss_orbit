# yss_orbit\backend\core\versioning\api_versioning.py
"""
Custom API Versioning scheme.
"""
from rest_framework.versioning import AcceptHeaderVersioning

class OrbitAPIVersioning(AcceptHeaderVersioning):
    """
    Custom versioning via Accept header.
    Format: Accept: application/json; version=1.0
    """
    default_version = "1.0"
    allowed_versions = ["1.0", "2.0"]
    version_param = "version"
