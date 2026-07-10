# yss_orbit\backend\apps\platform\catalogue\module_catalogue.py
class ModuleCatalogue:
    """
    Central registry of all sub-modules that exist underneath Domains.
    """
    MODULES = {
        "hrms": [
            {
                "code": "hrms_core", "name": "HRMS Core (Employees)", "is_core": True, 
                "is_premium": False, "version": "1.0.0", "is_deprecated": False, "dependencies": []
            },
            {
                "code": "attendance", "name": "Time & Attendance", "is_core": False, 
                "is_premium": False, "version": "1.0.0", "is_deprecated": False, "dependencies": ["hrms_core"]
            },
            {
                "code": "leave", "name": "Leave Management", "is_core": False, 
                "is_premium": False, "version": "1.0.0", "is_deprecated": False, "dependencies": ["hrms_core"]
            },
            {
                "code": "payroll", "name": "Payroll Processing", "is_core": False, 
                "is_premium": True, "version": "1.0.0", "is_deprecated": False, 
                "dependencies": ["hrms_core", "attendance", "leave"]
            },
            {
                "code": "recruitment", "name": "ATS & Recruitment", "is_core": False, 
                "is_premium": True, "version": "1.0.0", "is_deprecated": False, "dependencies": ["hrms_core"]
            },
        ],
        "pos": [
            {
                "code": "inventory", "name": "Inventory Management", "is_core": True,
                "is_premium": False, "version": "1.0.0", "is_deprecated": False, "dependencies": []
            },
            {
                "code": "customers", "name": "Customer Loyalty", "is_core": False,
                "is_premium": True, "version": "1.0.0", "is_deprecated": False, "dependencies": []
            },
        ],
        "pharmacy": [
            {
                "code": "drug_register", "name": "Drug & Compound Registry", "is_core": True,
                "is_premium": False, "version": "1.0.0", "is_deprecated": False, "dependencies": []
            },
            {
                "code": "pharmacy_billing", "name": "Pharmacy Point of Sale", "is_core": False,
                "is_premium": False, "version": "1.0.0", "is_deprecated": False, "dependencies": ["drug_register", "inventory"]
            },
        ]
    }

    @classmethod
    def get_modules_for_domain(cls, domain_code: str) -> list:
        mods = cls.MODULES.get(domain_code, [])
        return [{**m, "domain": domain_code} for m in mods]

    @classmethod
    def get_all_modules(cls) -> list:
        all_mods = []
        for domain_code, mods in cls.MODULES.items():
            for m in mods:
                all_mods.append({**m, "domain": domain_code})
        return all_mods
