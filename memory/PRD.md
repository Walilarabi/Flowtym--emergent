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

### Staff Configuration (Complete - 2026-03-24)
- [x] Services & Postes management (departments CRUD with positions)
- [x] Horaires & Shifts management (shift templates with code, times, majoration)
- [x] Contrats (Modeles) - contract templates with status toggle
- [x] Utilisateurs & Roles - permission matrix (8 permissions x 6 roles)
- [x] Documents RH - HR document types with mandatory/OCR flags
- [x] Parametres Staff - logo, emails, toggles, CP settings

### Staff Reporting (Complete - 2026-03-24)
- [x] KPI Cards (Collaborateurs actifs, Heures totales, Heures supp., Arrets maladie)
- [x] Period selector with month/year navigation
- [x] Employee details table with TOTAUX row
- [x] Hours by service bar chart
- [x] **REAL Functional Exports** - PDF (window.print), Excel (CSV download)
- [x] Auto-report toggle with email configuration

### Staff Recrutement (Complete - 2026-03-24)
- [x] Pipeline view (Kanban) - Nouveaux, Présélection, Entretien, Offre, Embauché
- [x] Job Offers CRUD with publish/unpublish
- [x] Candidates CRUD with status progression and rating
- [x] **AI Job Offer Generation (MOCK)** - Pre-filled French templates by department
- [x] Filters: search, status, job offer
- [x] Interview scheduling (endpoint ready)

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

### Staff Configuration
- `GET /api/hotels/{id}/config/departments`
- `POST /api/hotels/{id}/config/departments`
- `DELETE /api/hotels/{id}/config/departments/{id}`
- `GET /api/hotels/{id}/config/shifts`
- `POST /api/hotels/{id}/config/shifts`
- `DELETE /api/hotels/{id}/config/shifts/{id}`
- `GET /api/hotels/{id}/config/contract-templates`
- `GET /api/hotels/{id}/config/roles`
- `PUT /api/hotels/{id}/config/roles/{id}`
- `GET /api/hotels/{id}/config/hr-documents`
- `POST /api/hotels/{id}/config/hr-documents`
- `DELETE /api/hotels/{id}/config/hr-documents/{id}`
- `GET /api/hotels/{id}/config/settings`
- `PUT /api/hotels/{id}/config/settings`

### Staff Reporting
- `GET /api/hotels/{id}/reporting/staff-analytics`

### Staff Recrutement
- `GET /api/hotels/{id}/recruitment/job-offers`
- `POST /api/hotels/{id}/recruitment/job-offers`
- `PUT /api/hotels/{id}/recruitment/job-offers/{id}`
- `DELETE /api/hotels/{id}/recruitment/job-offers/{id}`
- `POST /api/hotels/{id}/recruitment/job-offers/generate-ai` (**MOCK**)
- `GET /api/hotels/{id}/recruitment/candidates`
- `POST /api/hotels/{id}/recruitment/candidates`
- `PUT /api/hotels/{id}/recruitment/candidates/{id}`
- `PATCH /api/hotels/{id}/recruitment/candidates/{id}/status`
- `PATCH /api/hotels/{id}/recruitment/candidates/{id}/rating`
- `DELETE /api/hotels/{id}/recruitment/candidates/{id}`
- `POST /api/hotels/{id}/recruitment/candidates/{id}/interviews`
- `GET /api/hotels/{id}/recruitment/pipeline-stats`

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
- [x] Staff Configuration (departments, shifts, roles, documents, settings)
- [x] Staff Reporting with real PDF/Excel exports
- [x] Staff Recrutement with MOCK AI generation

## P1 Features (Upcoming)
- [ ] Document storage integration (upload employee documents to cloud)
- [ ] Background scheduler for automated monthly CP accrual (CRON)
- [ ] Leave calendar visualization
- [ ] Real AI integration for job offer generation (replace MOCK)

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
- Preview: https://staff-portal-preview-2.preview.emergentagent.com
- Backend API: https://staff-portal-preview-2.preview.emergentagent.com/api

## Key Files
- Backend: `/app/backend/server.py`
- Frontend Entry: `/app/frontend/src/App.jsx`
- Design System: `/app/frontend/src/index.css`, `/app/frontend/tailwind.config.js`
- Navigation: `/app/frontend/src/components/layout/TopNavigation.jsx`, `/app/frontend/src/components/layout/SubNavigation.jsx`
- Staff Planning: `/app/frontend/src/pages/staff/StaffPlanning.jsx`
- Personnel: `/app/frontend/src/pages/staff/StaffEmployees.jsx`
- Add Employee Wizard: `/app/frontend/src/components/staff/AddEmployeeWizard.jsx`
- Staff Configuration: `/app/frontend/src/pages/staff/StaffConfiguration.jsx`
- Staff Reporting: `/app/frontend/src/pages/staff/StaffReporting.jsx`
- Staff Recrutement: `/app/frontend/src/pages/staff/StaffRecruitment.jsx`

---

## Mocked Features
- **Document Storage**: Employee documents in wizard are stored in form state only, not persisted to backend storage. Needs integration with object storage service.
- **Payment Webhooks**: Stripe/Adyen/PayPal endpoints are scaffolded but lack production event handling.
- **AI Job Offer Generation**: Returns pre-filled French templates by department (front_office, housekeeping, food_beverage). NOT connected to real AI.

## Test Credentials (Updated)
- Email: admin@flowtym.com
- Password: admin123
- Hotel ID: 4f02769a-5f63-4121-bb97-a7061563d934
