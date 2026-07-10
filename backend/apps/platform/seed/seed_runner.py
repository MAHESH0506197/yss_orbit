# yss_orbit\backend\apps\platform\seed\seed_runner.py
import logging

logger = logging.getLogger(__name__)

class PlatformSeedRunner:
    """
    Master orchestrator for seeding the YSS Orbit database.
    Executes in strict dependency order.
    """
    
    @classmethod
    def run_all(cls, stdout=None):
        """Runs the entire platform seeding process."""
        def out(msg):
            if stdout:
                stdout.write(msg)
            else:
                logger.info(msg)
                
        out("Starting Platform Seeding...")
        
        try:
            # Import seed modules dynamically to avoid circular dependencies
            from apps.platform.seed import (
                seed_domains,
                seed_modules,
                seed_permissions,
                seed_roles,
                seed_feature_flags,
                seed_subscription_plans,
                seed_admin_user
            )
            
            # Dependency order:
            # 1. Domains (Base modules)
            if hasattr(seed_domains, 'run_seed'):
                out("Seeding domains...")
                seed_domains.run_seed(stdout)
                
            # 2. Modules
            if hasattr(seed_modules, 'run_seed'):
                out("Seeding modules...")
                seed_modules.run_seed(stdout)

            # 3. Permissions
            if hasattr(seed_permissions, 'run_seed'):
                out("Seeding permissions...")
                seed_permissions.run_seed(stdout)

            # 4. Roles
            if hasattr(seed_roles, 'run_seed'):
                out("Seeding roles...")
                seed_roles.run_seed(stdout)
                
            # 5. Feature Flags
            if hasattr(seed_feature_flags, 'run_seed'):
                out("Seeding feature flags...")
                seed_feature_flags.run_seed(stdout)

            # 6. Subscription Plans
            if hasattr(seed_subscription_plans, 'run_seed'):
                out("Seeding subscription plans...")
                seed_subscription_plans.run_seed(stdout)

            # 7. Super Admin User (Platform level)
            if hasattr(seed_admin_user, 'run_seed'):
                out("Seeding super admin user...")
                seed_admin_user.run_seed(stdout)

            out("Platform Seeding Completed Successfully.")
        except Exception as e:
            out(f"Error during seeding: {str(e)}")
            logger.exception("Seeding failed")
            raise

    @classmethod
    def run_tenant_seed(cls, business_unit_id, stdout=None):
        """Runs seeding for a specific newly created tenant."""
        def out(msg):
            if stdout:
                stdout.write(msg)
            else:
                logger.info(msg)
                
        out(f"Starting Tenant Seeding for BU: {business_unit_id}...")
        
        try:
            # Tenant specific seeds here, e.g. default roles, settings, etc.
            out(f"Tenant {business_unit_id} seeded successfully.")
        except Exception as e:
            out(f"Error during tenant seeding: {str(e)}")
            logger.exception("Tenant seeding failed")
            raise
