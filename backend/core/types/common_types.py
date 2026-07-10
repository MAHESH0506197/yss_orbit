# yss_orbit\backend\core\types\common_types.py
"""
Common type definitions.
"""
from typing import Any, Dict, List, Optional, Union, Callable

JSONDict = Dict[str, Any]
JSONList = List[JSONDict]
JSONType = Union[JSONDict, JSONList, str, int, float, bool, None]

Kwargs = Dict[str, Any]
