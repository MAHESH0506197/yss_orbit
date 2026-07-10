# yss_orbit\backend\apps\platform\catalogue\domain_catalogue.py
class DomainCatalogue:
    """
    Central registry of all top-level business domains available in the YSS Orbit Platform.
    For example: HRMS, POS, Pharmacy, Real Estate.
    """
    DOMAINS = [
        {"code": "hrms", "name": "Human Resources Management", "description": "Core HR, Payroll, Leave, Attendance"},
        {"code": "pos", "name": "Point of Sale", "description": "Retail checkout, inventory, and customer management"},
        {"code": "pharmacy", "name": "Pharmacy Management", "description": "Drug registry, billing, and expiry tracking"},
        {"code": "real_estate", "name": "Real Estate Management", "description": "Property, tenant, and lease management"},
    ]

    @classmethod
    def get_available_domains(cls) -> list:
        return cls.DOMAINS

    @classmethod
    def get_domain(cls, code: str) -> dict | None:
        for domain in cls.DOMAINS:
            if domain['code'] == code:
                return domain
        return None
