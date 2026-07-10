# B30 - Development Standards for Modules & Features

This governance document outlines the mandatory standard that every new application module (e.g., Inventory, POS, CRM, Pharmacy, Finance) must follow within YSS Orbit. 

Any new module must conform to this exact standard before it can be merged into production.

## 1. Module Definition
Every module must clearly define its scope and metadata.
- **Module Name**: (e.g., `Inventory`)
- **Module Code**: (e.g., `inventory`)
- **Category**: (e.g., `Supply Chain` / `SUPPLY_CHAIN`)
- **Description**: A concise summary of the business capability.

## 2. Features Breakdown
A module must be decomposed into granular, licensable features.
- e.g., `FEATURE_STOCK_MANAGEMENT`, `FEATURE_PURCHASE_ORDERS`, `FEATURE_WAREHOUSES`
- Avoid creating monolithic features that encompass an entire app.

## 3. Dependencies
Explicitly document all dependencies.
- **Module Dependencies**: Does this module require another module? (e.g., `POS` requires `Inventory`).
- **Feature Dependencies**: Does a feature require another feature? (e.g., `Purchase Orders` requires `Stock Management`).

## 4. API Resources & Permissions
Every feature must define its API Resources, HTTP Methods, and resulting Permissions.
- **API Resource**: e.g., `purchase_order`
- **HTTP Methods**: e.g., `["GET", "POST", "PUT"]`
- **Permissions Generated**: e.g., `inventory.purchase_order.view`, `inventory.purchase_order.create`, `inventory.purchase_order.update`

## 5. Navigation & UI
Features intended to be accessed by users must define their frontend routing behavior.
- **is_visible_in_sidebar**: `true` or `false`
- **navigation_url**: e.g., `/platform/inventory/purchase-orders`
- **icon**: A standard Lucide icon (e.g., `ShoppingCart`)

## 6. Subscription Rules
Determine the provisioning defaults for the module and its features.
- **is_licensable**: Must explicit licenses be purchased?
- **is_premium**: Does this require a higher tier plan?
- **is_default_enabled**: Does every new tenant get this automatically?

## 7. Default Roles
Every module should provide standard `RoleTemplate` configurations.
- e.g., `Inventory Admin`, `Warehouse Staff`
- Detail which permissions are granted to these templates by default.

## 8. Tests
- **Unit Tests**: Full coverage for models and business logic.
- **Integration Tests**: API tests ensuring that `RequiresCapability` successfully blocks unauthorized access and allows authorized access.

## 9. Documentation
- Update `sync_rbac.py` with the new Permissions.
- Ensure the Module and Feature are seeded correctly during tenant creation or system bootstrap.
