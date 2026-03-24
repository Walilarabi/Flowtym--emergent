# Flowtym PMS - Product Requirements Document

## Overview
Flowtym is a modular and interoperable hotel Property Management System (PMS) SaaS designed for the French hospitality market.

## Core Problem Statement
Build a modern, full-featured PMS with:
- Visual Planning and Reservations management
- Client/Cardex management
- Night Audit and Accounting Reports
- Staff Management (time tracking, payroll, contracts)
- **Advanced Paid Leave (CP) and Public Holidays management**
- Edge-to-edge light mode minimalist UI
- Custom JWT authentication
- Payment integrations (Stripe, Adyen, PayPal)

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Authentication**: Custom JWT-based auth
- **Payments**: Stripe (scaffolded), Adyen, PayPal

## User Personas
1. **Hotel Manager**: Oversees all operations, staff management, financial reports
2. **Receptionist**: Handles reservations, check-ins/check-outs, client interactions
3. **HR Manager**: Manages staff schedules, contracts, payroll, leave requests

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

### Staff Module (Implemented)
- [x] Employee management
- [x] Shift planning
- [x] Time tracking (clock in/out)
- [x] Contract management
- [x] Payroll calculation (French social charges)
- [x] Staff dashboard

### Leave (CP) & Public Holidays System (NEW - Implemented 2026-03-24)
- [x] Leave configuration (accrual rates, rollover rules)
- [x] Monthly CP accrual (+2.08 days/month)
- [x] N/N-1 balance tracking
- [x] Leave requests (create/approve/reject)
- [x] Leave transactions history
- [x] French public holidays initialization (11 holidays with Easter calculation)
- [x] Holiday worked tracking with compensation options
- [x] Annual rollover logic (N to N-1)
- [x] Planning summary endpoint for UI
- [x] StaffPlanning.jsx updated with CP columns and tooltips

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Hotels
- `POST /api/hotels` - Create hotel
- `GET /api/hotels` - List hotels
- `GET /api/hotels/{id}` - Get hotel details

### Rooms
- `POST /api/hotels/{id}/rooms` - Create room
- `GET /api/hotels/{id}/rooms` - List rooms

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - List reservations
- `PUT /api/reservations/{id}` - Update reservation

### Staff
- `POST /api/hotels/{id}/staff/employees` - Create employee
- `GET /api/hotels/{id}/staff/employees` - List employees
- `POST /api/hotels/{id}/staff/shifts` - Create shift
- `GET /api/hotels/{id}/staff/shifts` - List shifts
- `POST /api/hotels/{id}/staff/time-entries/clock-in` - Clock in
- `POST /api/hotels/{id}/staff/time-entries/clock-out` - Clock out
- `POST /api/hotels/{id}/staff/contracts` - Create contract
- `POST /api/hotels/{id}/staff/payroll/calculate` - Calculate payroll

### Leave (CP) Management (NEW)
- `GET /api/hotels/{id}/leave/config` - Get leave configuration
- `PUT /api/hotels/{id}/leave/config` - Update leave configuration
- `GET /api/hotels/{id}/leave/balances` - Get all balances
- `GET /api/hotels/{id}/leave/balances/{employee_id}` - Get employee balance
- `POST /api/hotels/{id}/leave/balances/initialize` - Initialize balances
- `POST /api/hotels/{id}/leave/transactions` - Create transaction
- `GET /api/hotels/{id}/leave/transactions` - List transactions
- `POST /api/hotels/{id}/leave/requests` - Create leave request
- `GET /api/hotels/{id}/leave/requests` - List leave requests
- `PATCH /api/hotels/{id}/leave/requests/{id}/approve` - Approve request
- `PATCH /api/hotels/{id}/leave/requests/{id}/reject` - Reject request
- `POST /api/hotels/{id}/leave/accrual/run` - Run monthly accrual
- `POST /api/hotels/{id}/leave/rollover/run` - Run annual rollover

### Public Holidays (NEW)
- `POST /api/hotels/{id}/holidays` - Create holiday
- `GET /api/hotels/{id}/holidays` - List holidays
- `DELETE /api/hotels/{id}/holidays/{id}` - Delete holiday
- `POST /api/hotels/{id}/holidays/initialize/{year}` - Initialize French holidays
- `POST /api/hotels/{id}/holidays/worked` - Record worked holiday
- `GET /api/hotels/{id}/holidays/worked` - List worked holidays

### Planning Summary (NEW)
- `GET /api/hotels/{id}/staff/planning-summary` - Get aggregated CP/holiday data for UI

## Database Collections
- users
- hotels
- rooms
- reservations
- clients
- invoices
- payments
- night_audits
- staff_employees
- staff_shifts
- staff_time_entries
- staff_contracts
- staff_payroll
- leave_config (NEW)
- leave_balances (NEW)
- leave_transactions (NEW)
- leave_requests (NEW)
- public_holidays (NEW)
- holidays_worked (NEW)

## P0 Features (Complete)
- [x] Basic PMS functionality
- [x] Staff module base
- [x] CP/Leave management system
- [x] Public holidays management

## P1 Features (Upcoming)
- [ ] Leave configuration UI panel
- [ ] Background scheduler for automated monthly accrual (CRON)
- [ ] Automated N-1 expiry notifications
- [ ] PDF export for leave reports
- [ ] Leave calendar visualization

## P2 Features (Future)
- [ ] Payment webhooks (Stripe/Adyen/PayPal production)
- [ ] Channel Manager API sync (D-EDGE, SiteMinder)
- [ ] Accounting export (Sage, QuickBooks, Xero)
- [ ] Multi-hotel support
- [ ] Mobile app

## Test Credentials
- Email: test.cp@hotel.com
- Password: test123

## Environment URLs
- Preview: https://payroll-holidays.preview.emergentagent.com
- Backend API: https://payroll-holidays.preview.emergentagent.com/api

## Key Files
- Backend: `/app/backend/server.py`
- Frontend Entry: `/app/frontend/src/App.jsx`
- Staff Planning: `/app/frontend/src/pages/staff/StaffPlanning.jsx`
- Auth Context: `/app/frontend/src/context/AuthContext.jsx`
