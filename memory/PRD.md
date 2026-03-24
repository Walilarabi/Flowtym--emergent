# Flowtym PMS - Product Requirements Document

## Overview
Flowtym is a modular and interoperable hotel Property Management System (PMS) SaaS designed for the French hospitality market.

## Core Problem Statement
Build a modern, full-featured PMS with:
- Visual Planning and Reservations management
- Client/Cardex management
- Night Audit and Accounting Reports
- Staff Management (time tracking, payroll, contracts, scheduling)
- Advanced Paid Leave (CP) and Public Holidays management
- Modern UI with violet/purple accent, white/light grey backgrounds
- Custom JWT authentication
- Payment integrations (Stripe, Adyen, PayPal)

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Authentication**: Custom JWT-based auth
- **Payments**: Stripe (scaffolded), Adyen, PayPal

## Design System (NEW - Implemented 2026-03-24)
- **Primary Color**: Violet/Purple (#7c3aed)
- **Backgrounds**: White / Slate-50 / Slate-100
- **Typography**: Inter (body), Manrope (headings)
- **Contract Badges**: CDI (violet), CDD (amber), Extra (blue), Interim (orange)
- **Shift Status**: M (orange), S (blue), N (violet), OFF (slate), Repos (slate), CP (emerald), MAL (red), F (purple)

## User Personas
1. **Hotel Manager**: Oversees all operations, staff management, financial reports
2. **Receptionist**: Handles reservations, check-ins/check-outs, client interactions
3. **HR Manager**: Manages staff schedules, contracts, payroll, leave requests

---

## Implemented Features

### PMS Module (MVP Complete)
- [x] Authentication (login/register)
- [x] Hotel setup and configuration
- [x] Room management
- [x] Visual planning grid
- [x] Reservation CRUD
- [x] Client/Cardex management
- [x] Night Audit
- [x] Reports dashboard

### Staff Module (Complete - 2026-03-24)
- [x] Employee management (CRUD)
- [x] Staff Planning grid with status badges (M/S/N/OFF/Repos/CP/MAL/F)
- [x] Timeframe toggles (1 Semaine, 15 Jours, 1 Mois)
- [x] Mode Lecture / Historique views
- [x] Personnel page with Liste/Trombinoscope views
- [x] Employee detail modal (Contact, RH Info, Documents)
- [x] **Wizard "Ajouter un collaborateur"** (3 steps)
  - Step 1: Personal information
  - Step 2: Professional information (contract, salary)
  - Step 3: Documents upload/scan
- [x] Shift planning
- [x] Time tracking (clock in/out)
- [x] Contract management
- [x] Payroll calculation (French social charges)

### Leave (CP) & Public Holidays System (Complete - 2026-03-24)
- [x] Leave configuration (accrual rates, rollover rules)
- [x] Monthly CP accrual (+2.08 days/month)
- [x] N/N-1 balance tracking
- [x] Leave requests (create/approve/reject)
- [x] Leave transactions history
- [x] French public holidays initialization (11 holidays with Easter calculation)
- [x] Holiday worked tracking with compensation options
- [x] Annual rollover logic (N to N-1)
- [x] Planning summary endpoint for UI

### Design System Global (NEW - 2026-03-24)
- [x] Updated index.css with new CSS variables and utility classes
- [x] Updated tailwind.config.js with Flowtym colors
- [x] New TopNavigation with all modules
- [x] New SubNavigation with Staff tabs
- [x] Badge styles (contract types, shift status)
- [x] Modal/overlay styling
- [x] Employee card styling (Trombinoscope)
- [x] Wizard step indicators

---

## API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Staff Employees
- `POST /api/hotels/{id}/staff/employees`
- `GET /api/hotels/{id}/staff/employees`
- `PUT /api/hotels/{id}/staff/employees/{id}`
- `DELETE /api/hotels/{id}/staff/employees/{id}`

### Staff Planning/Shifts
- `POST /api/hotels/{id}/staff/shifts`
- `GET /api/hotels/{id}/staff/shifts`
- `DELETE /api/hotels/{id}/staff/shifts/{id}`

### Leave (CP) Management
- `GET /api/hotels/{id}/leave/config`
- `PUT /api/hotels/{id}/leave/config`
- `GET /api/hotels/{id}/leave/balances`
- `GET /api/hotels/{id}/leave/balances/{employee_id}`
- `POST /api/hotels/{id}/leave/balances/initialize`
- `POST /api/hotels/{id}/leave/transactions`
- `GET /api/hotels/{id}/leave/transactions`
- `POST /api/hotels/{id}/leave/requests`
- `GET /api/hotels/{id}/leave/requests`
- `PATCH /api/hotels/{id}/leave/requests/{id}/approve`
- `PATCH /api/hotels/{id}/leave/requests/{id}/reject`
- `POST /api/hotels/{id}/leave/accrual/run`
- `POST /api/hotels/{id}/leave/rollover/run`

### Public Holidays
- `POST /api/hotels/{id}/holidays`
- `GET /api/hotels/{id}/holidays`
- `DELETE /api/hotels/{id}/holidays/{id}`
- `POST /api/hotels/{id}/holidays/initialize/{year}`
- `POST /api/hotels/{id}/holidays/worked`
- `GET /api/hotels/{id}/holidays/worked`

### Planning Summary
- `GET /api/hotels/{id}/staff/planning-summary`

---

## Database Collections
- users, hotels, rooms, reservations, clients, invoices, payments
- night_audits, staff_employees, staff_shifts, staff_time_entries
- staff_contracts, staff_payroll
- leave_config, leave_balances, leave_transactions, leave_requests
- public_holidays, holidays_worked

---

## P0 Features (Complete)
- [x] Basic PMS functionality
- [x] Staff module with planning grid
- [x] CP/Leave management system
- [x] Public holidays management
- [x] Design System global refonte
- [x] Personnel Liste/Trombinoscope views
- [x] Add Employee Wizard (3 steps)

## P1 Features (Upcoming)
- [ ] Document storage integration (upload employee documents to cloud)
- [ ] Background scheduler for automated monthly CP accrual (CRON)
- [ ] Staff Configuration UI panel (departments CRUD)
- [ ] Leave calendar visualization
- [ ] PDF export for leave reports

## P2 Features (Future)
- [ ] Payment webhooks (Stripe/Adyen/PayPal production)
- [ ] Channel Manager API sync (D-EDGE, SiteMinder)
- [ ] Accounting export (Sage, QuickBooks, Xero)
- [ ] Multi-hotel support
- [ ] Mobile app

---

## Test Credentials
- Email: test.cp@hotel.com
- Password: test123

## Environment URLs
- Preview: https://payroll-holidays.preview.emergentagent.com
- Backend API: https://payroll-holidays.preview.emergentagent.com/api

## Key Files
- Backend: `/app/backend/server.py`
- Frontend Entry: `/app/frontend/src/App.jsx`
- Design System: `/app/frontend/src/index.css`, `/app/frontend/tailwind.config.js`
- Navigation: `/app/frontend/src/components/layout/TopNavigation.jsx`, `/app/frontend/src/components/layout/SubNavigation.jsx`
- Staff Planning: `/app/frontend/src/pages/staff/StaffPlanning.jsx`
- Personnel: `/app/frontend/src/pages/staff/StaffEmployees.jsx`
- Add Employee Wizard: `/app/frontend/src/components/staff/AddEmployeeWizard.jsx`

---

## Mocked Features
- **Document Storage**: Employee documents in wizard are stored in form state only, not persisted to backend storage. Needs integration with object storage service.
- **Payment Webhooks**: Stripe/Adyen/PayPal endpoints are scaffolded but lack production event handling.
