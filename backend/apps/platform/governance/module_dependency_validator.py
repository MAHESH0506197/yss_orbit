# yss_orbit\backend\apps\platform\governance\module_dependency_validator.py
"""
YSS Orbit — Module Dependency Validator (E04 §3.4)

FIX (was a 3-line empty stub): Implements the dependency-validation gate
E04 mandates before activating or deactivating a module on a BusinessUnit.

E04 §3.4 (paraphrased from the rulebook):
  "activate_module() MUST verify ALL `depends_on` modules are ACTIVE on the
   same BusinessUnit before activation is permitted."

This implementation extends the spirit of that rule symmetrically:
  - validate_activation(business_unit_id, module_code): every code in
    MODULE_DEPENDENCIES[module_code] must have an ACTIVE/TRIAL
    BusinessUnitModule row on this BU, or activation is rejected.
  - validate_deactivation(business_unit_id, module_code): no OTHER
    currently-ACTIVE/TRIAL module on this BU may list module_code in ITS
    depends_on — i.e. you cannot deactivate a module that something else
    on this BU still depends on. (Not explicitly in E04's text, but
    required for E04's overall consistency guarantee — without this check,
    activate_module()'s own dependency check could be satisfied at
    activation time and silently violated moments later.)

Exceptions raised: apps.platform.core_exceptions.ModuleNotActiveError /
ModuleConfigurationError (core.exceptions.module_exceptions — see that
module's docstrings) — these are ALREADY wired into
core.middleware.exception_handler.global_exception_handler, so callers
(business_unit_module_view.py) can simply let them propagate and the
correct {error_code, message} JSON response is produced automatically.

Module codes and their depends_on come from
apps.platform.seed.seed_modules.MODULE_DEPENDENCIES — the SAME source of
truth seed_modules.py uses to populate PlatformModule, so the dependency
graph is defined exactly once.
"""
from __future__ import annotations

import uuid

from core.exceptions.module_exceptions import ModuleNotActiveError, ModuleConfigurationError
from apps.organization.models import BusinessUnitModule
from apps.platform.seed.seed_modules import MODULE_DEPENDENCIES


def _active_module_codes(business_unit_id: uuid.UUID | str) -> set[str]:
    """
    Returns the set of PlatformModule codes that are currently
    ACTIVE or TRIAL (BusinessUnitModule.is_active == True, see model
    property — TRIAL counts as "on" for dependency purposes, matching
    E04's intent that a trialing module's dependents should also work).
    """
    rows = (
        BusinessUnitModule.objects
        .filter(
            business_unit_id=business_unit_id,
            status__in=[BusinessUnitModule.Status.ACTIVE, BusinessUnitModule.Status.TRIAL],
        )
        .select_related("module")
    )
    # Exclude rows whose TRIAL has expired — BusinessUnitModule.is_active
    # property already encodes this (status check + expiry check).
    return {row.module.code for row in rows if row.is_active}


def validate_activation(business_unit_id: uuid.UUID | str, module_code: str) -> None:
    """
    E04 §3.4: Before activating `module_code` on `business_unit_id`, every
    module it depends on must already be ACTIVE/TRIAL on the same BU.

    Raises:
        ModuleConfigurationError: `module_code` is not a recognised
            PlatformModule code (not in MODULE_DEPENDENCIES — i.e. not in
            the seed_modules catalogue).
        ModuleNotActiveError: one or more required dependencies are not
            active on this BusinessUnit. The exception message lists ALL
            missing dependencies at once (not just the first), so the
            caller/UI can present a complete "you must activate X, Y first"
            message rather than a frustrating one-at-a-time loop.
    """
    if module_code not in MODULE_DEPENDENCIES:
        raise ModuleConfigurationError(
            f"'{module_code}' is not a recognised platform module code."
        )

    required = MODULE_DEPENDENCIES[module_code]
    if not required:
        return  # No dependencies — always activatable.

    active_codes = _active_module_codes(business_unit_id)
    missing = [code for code in required if code not in active_codes]

    if missing:
        raise ModuleNotActiveError(
            f"Cannot activate '{module_code}': the following required "
            f"module(s) are not active on this Business Unit: "
            f"{', '.join(missing)}. Activate them first."
        )


def validate_deactivation(business_unit_id: uuid.UUID | str, module_code: str) -> None:
    """
    Symmetric check (extends E04 §3.4's consistency guarantee): before
    deactivating `module_code`, ensure no OTHER currently-active module on
    this BU has `module_code` in ITS depends_on list.

    Raises:
        ModuleNotActiveError: one or more active modules on this BU still
            depend on `module_code`. The message lists ALL dependents.
    """
    active_codes = _active_module_codes(business_unit_id)
    if module_code not in active_codes:
        return  # Already inactive — nothing to protect.

    dependents = [
        code for code, deps in MODULE_DEPENDENCIES.items()
        if code in active_codes and code != module_code and module_code in deps
    ]

    if dependents:
        raise ModuleNotActiveError(
            f"Cannot deactivate '{module_code}': the following active "
            f"module(s) on this Business Unit depend on it: "
            f"{', '.join(dependents)}. Deactivate them first."
        )


def get_dependents(module_code: str) -> list[str]:
    """
    Returns ALL module codes (active or not) that list `module_code` in
    their depends_on — used by the frontend to show "activating this will
    also unblock: ..." or "deactivating this will also disable: ..." hints
    without making a request per module.
    """
    return [
        code for code, deps in MODULE_DEPENDENCIES.items()
        if module_code in deps
    ]
