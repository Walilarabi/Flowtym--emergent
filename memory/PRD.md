# Flowtym PMS - Product Requirements Document

## Overview
Flowtym is a next-generation SaaS hotel property management system (PMS) built for modern hoteliers. It integrates multiple modules: PMS core, Revenue Management (RMS), Channel Manager, CRM, Booking Engine, Data Hub, and Configuration.

## User Personas
- **Hotel Admin**: Full access to all modules, configuration, and user management
- **Reception**: Daily operations, check-in/out, reservations
- **Revenue Manager**: Rate management, yield optimization, forecasting
- **Housekeeping**: Room status management
- **Super Admin**: Multi-property oversight, system administration

## Core Modules

### 1. PMS Core (Completed)
- Planning/Calendar view
- Reservations management
- Client profiles
- Arrivals/Departures
- Night Audit
- Reports

### 2. Revenue Management System - Hoptym RMS (Completed)
- Rate optimization
- Demand forecasting
- Competitive analysis
- Yield management

### 3. Channel Manager (Completed - MOCKED)
- OTA connections (mocked)
- Inventory distribution
- Rate parity

### 4. CRM Module (Completed)
- Guest profiles
- Communication history
- Loyalty programs
- Segmentation

### 5. Booking Engine (Completed)
- Direct booking widget
- Multi-language support
- Payment integration

### 6. Flowtym Data Hub (Completed - Phase 1)
- Universal data models for reservations, guests, transactions, rates, inventory
- 5 Connectors (MOCKED): Mews, Booking.com, Stripe, D-EDGE, Lighthouse
- Data normalization engine
- API gateway functionality
- Frontend with 6 views: Overview, Connectors, Sync, Data, API, Monitoring

### 7. Configuration Module (Completed - NEW)
**Purpose**: Central configuration hub serving as the "source of truth" for all hotel settings.

**Sections**:
1. **Hotel Profile**: General info, address, contact, regional settings (currency, timezone), check-in/out times, tax info
2. **Room Types (Typologies)**: Categories with codes, capacity, base prices, equipment, views, bathrooms
3. **Rooms (Inventory)**: Physical room list with Excel import functionality, floor/view/status management
4. **Rate Plans**: BAR (Best Available Rate) and derived plans with automatic calculation rules
5. **Policies**: Cancellation policies (flexible, strict, non-refundable) and payment policies (timing, deposit, methods)
6. **Users & Access**: RBAC system with roles (Admin, Reception, Revenue Manager, Housekeeping, Accounting, Readonly)
7. **Advanced Settings**: Taxes, booking rules, overbooking, price rounding, notifications

**APIs** (all at `/api/config/*`):
- `/hotels/{hotel_id}/profile` - GET/PUT
- `/hotels/{hotel_id}/room-types` - CRUD
- `/hotels/{hotel_id}/rooms` - CRUD
- `/hotels/{hotel_id}/rooms/import/template` - Excel template download
- `/hotels/{hotel_id}/rooms/import/preview` - Preview import
- `/hotels/{hotel_id}/rooms/import/confirm` - Execute import
- `/hotels/{hotel_id}/rate-plans` - CRUD + derivation
- `/hotels/{hotel_id}/cancellation-policies` - CRUD
- `/hotels/{hotel_id}/payment-policies` - CRUD
- `/hotels/{hotel_id}/users` - CRUD
- `/roles` - Available roles
- `/hotels/{hotel_id}/settings` - GET/PUT
- `/hotels/{hotel_id}/taxes` - Add/Remove
- `/hotels/{hotel_id}/summary` - Configuration progress

## Tech Stack
- **Backend**: FastAPI, Python, Pydantic, MongoDB (Motor async)
- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Recharts
- **Auth**: JWT-based authentication
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o (Emergent LLM Key)
- **Storage**: Emergent Object Storage

## Test Credentials
- **Admin**: admin@flowtym.com / admin123
- **Super Admin**: superadmin@flowtym.com / super123
- **Hotel ID**: 4f02769a-5f63-4121-bb97-a7061563d934

## Completion Status

### Completed (100%)
- [x] PMS Core
- [x] Revenue Management (RMS)
- [x] Channel Manager (mocked)
- [x] CRM Module
- [x] Booking Engine
- [x] Data Hub - Phase 1
- [x] **Configuration Module** (NEW - Backend + Frontend)
  - [x] Backend APIs (23 endpoints tested)
  - [x] Excel import for rooms
  - [x] Frontend with 7 sections
  - [x] Multi-tenant architecture

### In Progress / Upcoming (P1-P2)
- [ ] Data Hub - Phase 2 (Event Orchestration, Smart Caching, Priority Engine)
- [ ] Inter-module connectivity (Config → RMS, Config → Data Hub)
- [ ] External API Marketplace
- [ ] Real-time webhooks for reservations

## Design Guidelines
See `/app/design_guidelines.json` for complete UI/UX specifications including:
- Color palette (violet primary, dark backgrounds)
- Typography (Manrope for headings, Inter for body)
- Component patterns (cards, modals, tables)
- Layout guidelines

## Architecture
```
/app/
├── backend/
│   ├── server.py           # Main FastAPI app
│   ├── config/             # Configuration module
│   │   ├── routes.py       # API endpoints
│   │   ├── models/         # Pydantic schemas
│   │   └── services/       # Business logic (Excel import)
│   ├── datahub/            # Data Hub module
│   ├── rms/                # RMS module
│   └── crm/                # CRM module
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── config/     # Configuration pages
│       │   ├── datahub/    # Data Hub pages
│       │   ├── rms/        # RMS pages
│       │   └── crm/        # CRM pages
│       └── components/
│           └── ui/         # Shadcn components
└── memory/
    └── PRD.md              # This file
```

## Test Reports
- `/app/test_reports/iteration_17.json` - Data Hub Backend
- `/app/test_reports/iteration_18.json` - Data Hub Frontend
- `/app/test_reports/iteration_19.json` - Configuration Module (100% passed)

---
*Last updated: March 25, 2026*
*Version: 2.0 - Configuration Module Complete*
