# yss_orbit\backend\core\base\types.py
"""
Core types for the application.
"""
from typing import TypeVar, Any, Dict, List, Optional, Union, Callable
from django.db.models import Model
from rest_framework.serializers import Serializer

# Generic Model Type
ModelType = TypeVar("ModelType", bound=Model)

# Generic Serializer Type
SerializerType = TypeVar("SerializerType", bound=Serializer)

# Common response types
JsonDict = Dict[str, Any]
JsonList = List[JsonDict]
