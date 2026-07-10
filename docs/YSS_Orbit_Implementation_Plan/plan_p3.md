# YSS Orbit Implementation Plan - Part 3: Independent Domain - Retail, Pharmacy & Inventory

> **ARCHITECTURE MANDATE:** These modules operate independently of HRMS. A client may subscribe to Retail without ever purchasing the HRMS module. Cross-module joins are strictly forbidden (Rulebook B05).

## Independent Module: Inventory & Master Catalog
The foundational module for all physical goods.
- **Data Boundary:** Products, Batches, Warehouses, GRN.
- **Event Publishing:** Emits `inventory.stock_updated`, `inventory.low_stock`.

## Independent Module: Retail POS & Sales
The point-of-sale module for general retail.
- **Integration:** Uses soft references to Inventory items.
- **Event Consumption:** Listens to `inventory.stock_updated` to prevent overselling.
- **Event Publishing:** Emits `sale.completed` (which the Inventory module consumes to deduct stock).

## Independent Module: Pharmacy & Rx
A specialized healthcare module.
- **Data Boundary:** Prescriptions, Medical Items, Expiry Tracking.
- **Compliance:** Enforces strict HIPAA/Data Privacy rules (Rulebook C01) on patient records.
- **Event Integration:** Integrates with Inventory via async events for stock deduction.
