<!-- yss_orbit\rulebooks\B22 - WHITE LABEL, TENANT BRANDING & PLATFORM IDENTITY.md -->
# B22 - WHITE LABEL, TENANT BRANDING & PLATFORM IDENTITY

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Series:** Backend Platform Governance
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B04 (Application Architecture), E04 (Platform Governance - Feature Flags & Subscriptions)
**Governance Role:** Branding Architecture Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Platform identity hierarchy, branding modes (Platform/Co-Brand/White-Label), BrandConfiguration schema, ThemeEngine standards, domain/subdomain strategy, tenant branding isolation, allowed vs prohibited customization governance, frontend branding provider standards, upgrade-safe branding rules |
| REFERENCES | E04 (white_label feature flag gating), B02 (branding scoped per Organization and BusinessUnit), B11 (file storage - logo/asset handling), B13 (branding config caching), B15 (branding change audit logging), F01 (frontend platform shell - BrandingProvider placement), F03 (branding state in TenantContext) |
| MUST NOT DUPLICATE | Feature flag mechanics (E04), file upload security (B11), tenant isolation mechanics (B02) |

---

## 1. PURPOSE

This rulebook defines the **White Label, Tenant Branding, and Platform Identity standards** for YSS Orbit.

Without these standards, enterprise SaaS branding becomes:
- Client-specific code forks that break on every platform upgrade
- Inconsistent visual behavior across tenants
- Security gaps where branding config bypasses authorization
- Maintenance nightmares where each client has custom styling embedded in the codebase

This rulebook establishes a **configuration-driven branding system** that supports all branding modes from a single codebase, with zero per-tenant code forks.

---

## 2. PLATFORM IDENTITY HIERARCHY (CANONICAL - NEVER CHANGE)

The YSS Orbit platform identity has four canonical levels. This hierarchy is permanent and must be understood by all engineers before implementing any branding feature.

```
LEVEL 1 - COMPANY IDENTITY
    YSS
    (Legal entity, parent company - internal only, never public-facing)

LEVEL 2 - PLATFORM IDENTITY
    YSS Orbit Platform
    (Engineering platform identity - exists even when client hides it visually)

LEVEL 3 - PRODUCT SUITE
    Orbit Retail       → Retail Operations domain
    Orbit HR           → HRMS domain
    Orbit Payroll      → Payroll module
    Orbit Attendance   → Attendance module
    Orbit Pharmacy     → Pharmacy Management domain

LEVEL 4 - CLIENT BRANDING LAYER
    Platform Brand Mode    → Client sees YSS Orbit branding
    Co-Brand Mode          → Client logo + "powered by YSS Orbit"
    Full White Label Mode  → Client sees only their own brand
```

**Critical Rule:** Regardless of which branding mode a client uses, the platform internally is ALWAYS **YSS Orbit Platform**. A white-label deployment does not change the platform architecture, data model, codebase, or identity. It only changes the visual presentation layer.

---

## 3. BRANDING MODES - THREE MODES ONLY (MANDATORY)

YSS Orbit supports exactly THREE branding modes. No other modes are supported. Any client requesting a mode outside these three must be offered the closest matching mode.

### Mode 1 - Platform Brand Mode

**What:** Client uses YSS Orbit's branding as-is. No customization beyond organization name.

**When to use:** Small clients, starter plans, free trials.

**Visual:**
```
┌────────────────────────────┐
│  YSS Orbit                 │  ← YSS logo
│  Powered for ABC Retail    │  ← optional org name
└────────────────────────────┘
```

**URL:** `abc.yssorbit.com`

**Allowed customizations:** None (org name display only).

**Plan:** FREE and BASIC plans.

### Mode 2 - Co-Brand Mode (Default for Most Clients)

**What:** Client's logo and name displayed prominently. YSS Orbit attribution shown in smaller form. Tenant can customize primary colors and logo.

**When to use:** Medium clients who want their identity visible but are comfortable with YSS Orbit attribution.

**Visual:**
```
┌────────────────────────────┐
│  [ABC Retail Logo]         │  ← client logo
│  ABC Retail                │  ← client name
│  powered by YSS Orbit      │  ← attribution (small)
└────────────────────────────┘
```

**URL:** `abc.yssorbit.com` or `portal.abcretail.com` (custom domain optional at PRO).

**Allowed customizations:** Logo, company name, primary color, secondary color, favicon, login background.

**Plan:** BASIC and PRO plans.

### Mode 3 - Full White Label Mode

**What:** Client sees ONLY their own brand. No YSS Orbit branding visible anywhere - no logo, no "powered by", no YSS mentions in the UI. Custom domain required. Full theme control.

**When to use:** Enterprise clients with specific brand requirements, resellers.

**Visual:**
```
┌────────────────────────────┐
│  [CLIENT FULL LOGO]        │  ← client logo only
│  ABC Retail Operations     │  ← client name
│  (no YSS mention anywhere) │
└────────────────────────────┘
```

**URL:** `portal.abcretail.com` (client's own domain - mandatory for full white label).

**Allowed customizations:** All (see Section 5).

**Plan:** ENTERPRISE plan only. Gated by `white_label` feature flag (E04 §3.7).

**Backend law:** Even in Full White Label Mode, the platform running behind the scenes is YSS Orbit Platform. This fact is never exposed to the end user but is the engineering reality.

---

## 4. BRAND CONFIGURATION - DATABASE SCHEMA (MANDATORY)

```sql
-- brand_configuration table
-- Owned at Organization level.
-- Can be overridden at BusinessUnit level for per-branch theming (optional).
CREATE TABLE brand_configuration (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES organizations(id),
    business_unit_id      UUID REFERENCES business_units(id),
                          -- NULL = organization-level config (applies to all BUs)
                          -- Non-NULL = BusinessUnit-level override

    -- Branding Mode
    branding_mode         VARCHAR(20) NOT NULL DEFAULT 'platform',
                          -- ENUM: 'platform' | 'co_brand' | 'white_label'

    -- Identity
    company_name          VARCHAR(255),        -- displayed brand name
    company_tagline       VARCHAR(500),        -- optional tagline

    -- Assets
    logo_url              VARCHAR(1000),       -- primary logo (stored via B11)
    logo_dark_url         VARCHAR(1000),       -- dark-mode variant
    favicon_url           VARCHAR(1000),       -- browser favicon
    login_background_url  VARCHAR(1000),       -- login page background image
    email_header_logo_url VARCHAR(1000),       -- logo for email templates

    -- Theme Colors
    primary_color         VARCHAR(7),          -- hex #RRGGBB
    secondary_color       VARCHAR(7),
    accent_color          VARCHAR(7),
    sidebar_bg_color      VARCHAR(7),
    sidebar_text_color    VARCHAR(7),

    -- Typography (ENTERPRISE only)
    font_family_heading   VARCHAR(100),        -- Google Font name or 'default'
    font_family_body      VARCHAR(100),

    -- Feature Toggles
    powered_by_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
                          -- FALSE = hide "powered by YSS Orbit"
                          -- Only allowed in white_label mode
    custom_css_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
                          -- TRUE = allow custom_css field
                          -- ENTERPRISE only - gated by feature flag

    -- Advanced (ENTERPRISE only)
    custom_domain         VARCHAR(255),        -- portal.abcretail.com
    custom_css            TEXT,               -- advanced CSS overrides

    -- Module Label Overrides
    module_labels_json    JSONB,
                          -- {"HRMS": "People", "PAYROLL": "Salary", "POS": "Billing"}
                          -- allows renaming modules per client

    -- Email Branding
    email_branding_json   JSONB,
                          -- {"footer_text": "ABC Retail Ltd", "support_email": "hr@abcretail.com"}

    -- Audit
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_by            UUID REFERENCES users(id),
    updated_by            UUID REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: one config per org (or one per org+bu)
    UNIQUE(organization_id, business_unit_id)
);

-- Index for fast lookup on login (domain-based tenant detection):
CREATE UNIQUE INDEX idx_brand_custom_domain
    ON brand_configuration(custom_domain)
    WHERE custom_domain IS NOT NULL;

CREATE INDEX idx_brand_org
    ON brand_configuration(organization_id)
    WHERE is_active = TRUE;
```

---

## 5. ALLOWED VS PROHIBITED CUSTOMIZATION (MANDATORY GOVERNANCE)

This is the most important section for protecting SaaS scalability. Every client request for customization MUST be evaluated against this table.

### ALLOWED - Configuration-driven (safe)

| Category | Allowed Customization |
|----------|-----------------------|
| **Branding** | Logo, favicon, company name, tagline, login background |
| **Theme** | Primary color, secondary color, accent color, sidebar colors |
| **Typography** | Font family (from approved Google Fonts list) |
| **Domain** | Custom subdomain (PRO), fully custom domain (ENTERPRISE) |
| **Module Labels** | Rename module display names (e.g., "HRMS" → "People") |
| **Email** | Email header logo, footer text, support email in templates |
| **Workflow Config** | Approval chains, shift rules, leave policies, payroll cycles |
| **Feature Control** | Feature flags, module enable/disable, subscription plan |
| **Reporting** | Custom report templates, scheduled exports, dashboard widgets |
| **Notifications** | Notification templates, channel preferences |
| **Field Visibility** | Show/hide optional fields via settings (not schema changes) |
| **Holiday Calendar** | Custom public holidays per BusinessUnit |

### PROHIBITED - Code-fork level (dangerous)

| Prohibited Request | Why Prohibited | Correct Response |
|-------------------|----------------|-----------------|
| Custom backend logic per client | Destroys SaaS scalability - each client becomes bespoke software | Offer configurable workflow settings or feature flags |
| Tenant-specific DB schema changes | Breaks shared schema multi-tenancy | Offer custom fields via JSONB extension pattern |
| Separate frontend builds per client | Cannot maintain or upgrade independently | Use BrandingProvider + dynamic theme loading |
| Custom code patches per tenant | Impossible to upgrade safely | All customization via config - no code forks |
| Bypass RBAC for "trusted" clients | Security architecture violation | RBAC applies to all tenants equally - no exceptions |
| Custom API versions per client | Breaks API governance | Supported via feature flags and module versions |
| Tenant-owned custom modules | Cannot govern, test, or upgrade | Offer the Marketplace Modules pattern (future roadmap) |

**Critical Law:** If a client request is in the PROHIBITED list, the response is ALWAYS "No - here is the supported configuration-based alternative." Never accept a request that requires per-tenant code or schema changes. This is the most important SaaS scalability protection rule.

---

## 6. BRANDING RESOLUTION LOGIC (MANDATORY)

At login and on BusinessUnit selection, the frontend loads the BrandConfiguration using this resolution order:

```python
def resolve_brand_config(organization_id: UUID, business_unit_id: UUID) -> BrandConfig:
    """
    Resolution order:
    1. BusinessUnit-level override (if exists)
    2. Organization-level config (fallback)
    3. Platform defaults (final fallback)
    """
    # Step 1: BusinessUnit override
    bu_config = BrandConfiguration.objects.filter(
        organization_id=organization_id,
        business_unit_id=business_unit_id,
        is_active=True,
    ).first()
    if bu_config:
        return bu_config

    # Step 2: Organization-level
    org_config = BrandConfiguration.objects.filter(
        organization_id=organization_id,
        business_unit_id__isnull=True,
        is_active=True,
    ).first()
    if org_config:
        return org_config

    # Step 3: Platform defaults
    return PlatformDefaultBrandConfig()
```

**Platform defaults (Mode 1 - Platform Brand):**
```python
PLATFORM_DEFAULTS = {
    "branding_mode": "platform",
    "company_name": "YSS Orbit",
    "logo_url": "/static/platform/yss-orbit-logo.svg",
    "favicon_url": "/static/platform/favicon.ico",
    "primary_color": "#2563EB",
    "secondary_color": "#0D9488",
    "powered_by_enabled": True,
}
```

---

## 7. DOMAIN / SUBDOMAIN STRATEGY (MANDATORY)

```
Platform main:       yssorbit.com
Tenant subdomain:    {org-code}.yssorbit.com        → Mode 1 and Mode 2
Custom domain:       portal.abcretail.com            → Mode 3 (ENTERPRISE only)
```

**Domain-based tenant detection flow (mandatory for login page):**
```
User visits: portal.abcretail.com
     ↓
Nginx/reverse proxy passes Host header to Django
     ↓
TenantDetectionMiddleware:
  1. Extract host from request: portal.abcretail.com
  2. Query: SELECT organization_id FROM brand_configuration WHERE custom_domain = 'portal.abcretail.com'
  3. If found → load BrandConfig for that organization
  4. If not found → extract subdomain (abc from abc.yssorbit.com) → lookup org by code
  5. If neither → serve platform-default branding (login page with YSS Orbit brand)
     ↓
Load BrandConfiguration
     ↓
Return branding JSON to frontend login page
     ↓
Frontend applies theme BEFORE rendering login form
```

**SSL for custom domains:** Each custom domain MUST have its own SSL certificate. Use Let's Encrypt with automated renewal. Custom domain SSL setup is an ENTERPRISE onboarding step.

---

## 8. BACKEND MODULE STRUCTURE (MANDATORY)

```
backend/apps/branding/
├── __init__.py
├── models/
│   ├── __init__.py
│   └── brand_configuration.py    # BrandConfiguration model
├── services/
│   ├── __init__.py
│   ├── brand_service.py          # resolve_brand_config(), validate_config()
│   └── domain_detection.py      # tenant detection from Host header
├── repositories/
│   ├── __init__.py
│   └── brand_repository.py      # DB access - tenant-scoped
├── api/
│   ├── __init__.py
│   ├── views/
│   │   ├── brand_config_view.py  # CRUD for brand config (ORG_ADMIN only)
│   │   └── public_brand_view.py  # Public: GET /api/v1/branding/public/{org_code}/
│   ├── serializers/
│   │   └── brand_serializers.py
│   └── urls.py
├── middleware/
│   └── tenant_detection.py      # Domain/subdomain → org detection
└── tests/
    ├── test_brand_service.py
    ├── test_domain_detection.py
    └── test_brand_api.py
```

**API Endpoints:**
```
# Public (no auth - used by login page before auth):
GET  /api/v1/branding/public/{org_code}/      → returns safe branding fields only

# Authenticated (ORG_ADMIN only):
GET  /api/v1/branding/config/
POST /api/v1/branding/config/
PUT  /api/v1/branding/config/{id}/
```

**Security:** The public branding endpoint MUST return ONLY safe fields:
- `company_name`, `logo_url`, `favicon_url`, `login_background_url`, `primary_color`, `secondary_color`, `powered_by_enabled`, `branding_mode`

It MUST NOT return: `custom_css`, `organization_id`, internal IDs, or any auth-related data.

---

## 9. BRANDING CACHING (MANDATORY)

BrandConfiguration is read on every page load for unauthenticated users (login page). It MUST be cached.

```python
# Cache key:
brand_config:{organization_id}           TTL: 600 seconds (10 min)
brand_config:domain:{custom_domain}      TTL: 600 seconds

# Invalidate on:
# - BrandConfiguration saved/updated → invalidate brand_config:{org_id}
# - Custom domain changed → invalidate brand_config:domain:{old_domain} AND brand_config:{org_id}
```

Cache warming: On application startup, warm the top 50 most-accessed organizations' brand configs.

---

## 10. FRONTEND IMPLEMENTATION (MANDATORY)

### 10.1 Never Hardcode Branding (MANDATORY)

```typescript
// PROHIBITED - hardcoded branding:
<img src="/assets/yss-orbit-logo.svg" alt="YSS Orbit" />
<span>YSS Orbit</span>
<div style={{ color: '#2563EB' }}>...</div>

// REQUIRED - config-driven branding:
const { branding } = useBranding();
<img src={branding.logoUrl} alt={branding.companyName} />
<span>{branding.companyName}</span>
<div style={{ color: branding.primaryColor }}>...</div>
```

### 10.2 Provider Hierarchy (MANDATORY)

```typescript
// Root application - provider order is mandatory:
<BrandingProvider>          {/* loads BrandConfig, applies CSS variables */}
  <AuthProvider>            {/* authentication state */}
    <TenantProvider>        {/* BusinessUnit context */}
      <FeatureFlagProvider> {/* feature flags */}
        <App />
      </FeatureFlagProvider>
    </TenantProvider>
  </AuthProvider>
</BrandingProvider>
```

**BrandingProvider** MUST be the outermost provider because branding must be applied BEFORE the login page renders - even for unauthenticated users.

### 10.3 ThemeEngine - CSS Variables (MANDATORY)

```typescript
const BrandingProvider = ({ children }: { children: React.ReactNode }) => {
  const [branding, setBranding] = useState<BrandConfig>(PLATFORM_DEFAULTS);

  useEffect(() => {
    // Apply brand config as CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--color-primary',        branding.primaryColor);
    root.style.setProperty('--color-secondary',      branding.secondaryColor);
    root.style.setProperty('--color-accent',         branding.accentColor);
    root.style.setProperty('--color-sidebar-bg',     branding.sidebarBgColor);
    root.style.setProperty('--color-sidebar-text',   branding.sidebarTextColor);
    root.style.setProperty('--font-heading',         branding.fontFamilyHeading ?? 'inherit');
    root.style.setProperty('--font-body',            branding.fontFamilyBody ?? 'inherit');

    // Set favicon dynamically
    if (branding.faviconUrl) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) link.href = branding.faviconUrl;
    }

    // Set document title
    document.title = branding.companyName ?? 'YSS Orbit';
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};
```

All UI components MUST use CSS variables for colors - never hardcoded hex values.

### 10.4 Module Label Overrides (MANDATORY)

```typescript
// Hook for getting display name of a module (supports client renaming):
function useModuleLabel(moduleCode: string): string {
  const { branding } = useBranding();
  const overrides = branding.moduleLabels ?? {};
  return overrides[moduleCode] ?? MODULE_DEFAULT_LABELS[moduleCode] ?? moduleCode;
}

// Usage in sidebar:
<SidebarItem label={useModuleLabel('HRMS')} />
// Client with {"HRMS": "People"} sees: "People"
// Client without override sees: "HRMS" (default)
```

### 10.5 Login Page Domain Detection Flow (MANDATORY)

```typescript
// On login page mount - before showing any UI:
const LoginPage = () => {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(PLATFORM_DEFAULTS);

  useEffect(() => {
    const orgCode = extractOrgCodeFromHostname(window.location.hostname);
    if (orgCode) {
      fetch(`/api/v1/branding/public/${orgCode}/`)
        .then(r => r.json())
        .then(data => setBrandConfig(data.data))
        .catch(() => setBrandConfig(PLATFORM_DEFAULTS)); // always fallback to defaults
    }
  }, []);

  return (
    <div style={{ backgroundImage: `url(${brandConfig.loginBackgroundUrl})` }}>
      <img src={brandConfig.logoUrl} alt={brandConfig.companyName} />
      <h1>{brandConfig.companyName}</h1>
      {brandConfig.poweredByEnabled && (
        <small>Powered by YSS Orbit</small>
      )}
      <LoginForm />
    </div>
  );
};
```

---

## 11. BRANDING SECURITY RULES (MANDATORY)

- Branding config changes MUST be restricted to `ORG_ADMIN` and `SUPER_ADMIN` roles only
- `custom_css` field MUST be sanitized before storage - strip `<script>`, `javascript:`, `@import url(http...)` patterns
- `logo_url`, `favicon_url`, `login_background_url` MUST be validated as URLs pointing to the platform's own CDN - external arbitrary URLs are PROHIBITED
- `custom_domain` MUST be verified as owned by the organization (DNS TXT record verification) before activation
- The public branding API MUST NOT expose internal organization IDs or security-sensitive fields
- Branding configuration changes MUST be audit-logged (B15) with before/after values

---

## 12. BRANDING DOES NOT AFFECT BUSINESS LOGIC (CRITICAL LAW)

**The branding layer MUST ONLY affect:**
- Visual presentation (colors, logos, fonts)
- Display labels (module names, company name)
- UI layout (sidebar theme, login background)
- Email templates (header logo, footer text)

**The branding layer MUST NEVER affect:**
- RBAC or permissions
- Tenant isolation or data access
- Business logic or workflow rules
- Security headers or authentication
- API response data content
- Database query filters

**Why:** If branding configuration can influence business logic, a malicious actor could potentially manipulate branding settings to alter system behavior. Branding is presentation only - it is completely orthogonal to security and business logic.

---

## 13. UPGRADE SAFETY (MANDATORY)

All branding must remain upgrade-safe. This means:

- No per-tenant frontend code forks - ALL tenants run the SAME frontend build
- Brand customization applied at RUNTIME via CSS variables and API-loaded config - not at build time
- Platform frontend upgrades MUST NOT require per-tenant config re-validation
- `custom_css` MUST be applied last (lowest specificity from platform perspective) so platform style updates do not require coordination with custom CSS clients

**Upgrade-safe custom CSS strategy:**
```css
/* Platform styles applied first (base) */
/* Client custom_css applied as a <style> tag in <head> - loaded last */
/* Client CSS MUST only target: --color-*, brand-specific class names */
/* Platform internals (layout, RBAC-governed elements) MUST be protected from client CSS */
```

---

## 14. NON-NEGOTIABLE RULES

- Branding NEVER hardcoded in any component - all from `useBranding()` hook
- BrandingProvider MUST wrap the entire application (outermost provider)
- Public branding API MUST NOT return security-sensitive fields
- `powered_by_enabled = false` ONLY allowed in `white_label` mode AND requires `white_label` feature flag active
- Custom domain MUST require DNS verification before activation
- `custom_css` MUST be sanitized before storage
- Per-tenant code forks = PROHIBITED (no exceptions)
- Per-tenant DB schema = PROHIBITED (no exceptions)
- Per-tenant frontend builds = PROHIBITED (no exceptions)
- Branding changes MUST be audit-logged
- Branding MUST NOT influence RBAC, business logic, or security

---

## 15. TESTING REQUIREMENTS (MANDATORY)

- BrandConfiguration resolution order tested (BU override → Org config → Platform defaults)
- Domain detection tested (custom domain → org lookup)
- Public branding API returns ONLY safe fields (no org_id, no CSS in non-ENTERPRISE)
- `powered_by_enabled = false` blocked when not in `white_label` mode
- `custom_domain` blocked without DNS verification
- CSS variable application tested in ThemeEngine
- Module label override tested (`useModuleLabel` returns override when set)
- Branding change audit log entry created on save
- Branding cache invalidated on config update
- Login page renders platform defaults when no org detected
- Any failing test MUST block deployment

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*
