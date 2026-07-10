# YSS Orbit Implementation Plan - Part 1: Core Platform & App Store Engine

> **ARCHITECTURE MANDATE:** YSS Orbit is an App Store / Modular SaaS platform. This document outlines the mandatory foundational layers. No business modules (HRMS, Retail) can be built until this foundation is complete.

## Phase 1: Core Platform Foundation (Mandatory for all tenants)
This phase establishes the base Django infrastructure, Multi-Tenancy (Row-Level Security), and Global IAM.

### 1.1 Infrastructure & Tenancy (Rulebook B02, B08)
- Configure PostgreSQL with row-level isolation policies.
- Every table MUST inherit from a base model containing `business_unit_id`.
- Implement `TenantMiddleware` to automatically scope all queries.

### 1.2 Identity & Access Management (IAM) (Rulebook B06, B07)
- Implement Global Users (one identity across all tenants).
- Implement `UserBusinessUnit` mapping.
- Implement strictly scoped RBAC (Roles & Permissions) bounded by `business_unit_id`.

## Phase 2: The Module Registry & Subscription Engine (Rulebook E04)
Before building any business domains, the "App Store" gatekeeper must be established.

### 2.1 Module Registry
- Implement the centralized registry where independent modules (Retail, HRMS, etc.) register themselves.
- Define feature flags and plan limits.

### 2.2 Tenant Subscriptions
- Implement the Subscription API.
- Tenants can subscribe to specific modules.
- **Enforcement:** API gateways and Frontend routes must verify the `business_unit_id` has an active subscription to the requested module before rendering or processing.
