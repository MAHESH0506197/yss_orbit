# YSS Orbit Implementation Plan - Part 2: Independent Domain - HR & Payroll

> **ARCHITECTURE MANDATE:** The modules defined here are 100% independent. They MUST NOT share foreign keys with Retail, Pharmacy, or any other unrelated domain. They communicate with other domains strictly via the Event Bus (Rulebook E01).

## Independent Module: HRMS Core
Clients who subscribe to the HRMS module gain access to employee management.
- **Data Boundary:** Employee records, Departments, Designations.
- **Event Publishing:** Emits `employee.created`, `employee.terminated` to the Outbox.

## Independent Module: Attendance & Leave
Clients can add this module to track employee time.
- **Integration:** Soft UUID references to `employee_id`. No hard database cascades.
- **Event Publishing:** Emits `attendance.finalized`, `leave.approved`.

## Independent Module: Payroll Processing
A highly sensitive module that orchestrates financial payouts.
- **Decoupling:** Payroll DOES NOT query the Attendance tables directly using SQL JOINs.
- **Event Consumption:** Payroll listens to `attendance.finalized` and `leave.approved` events from the Event Bus to calculate deductions and payouts safely.
