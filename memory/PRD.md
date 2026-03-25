# Flowtym PMS - Product Requirements Document

## Overview
Flowtym is a next-generation SaaS hotel property management system (PMS) built for modern hoteliers. It integrates multiple modules: PMS core, Revenue Management (RMS), Channel Manager, CRM, Booking Engine, Data Hub, and Configuration.

## User Personas
- **Hotel Admin**: Full access to all modules, configuration, and user management
- **Reception**: Daily operations, check-in/out, reservations
- **Revenue Manager**: Rate management, yield optimization, forecasting
- **Housekeeping**: Room status management
- **Super Admin**: Multi-property oversight, system administration

## Architecture Overview

### Central Configuration Module
The Configuration module serves as the **"Source of Truth"** for all hotel settings. All other modules access configuration through the centralized `ConfigService`.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION MODULE                          │
│  (Room Types, Rate Plans, Policies, Users, Taxes, Settings)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   ConfigService    │
                    │   (Shared API)     │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────┴────┐          ┌─────┴────┐          ┌────┴────┐
   │   RMS   │          │ Data Hub │          │   PMS   │
   │ (Sync)  │          │(Distrib) │          │(Future) │
   └─────────┘          └──────────┘          └─────────┘
```

## Core Modules

### 1. PMS Core (Completed)
- Planning/Calendar view
- Reservations management
- Client profiles
- Arrivals/Departures
- Night Audit
- Reports

### 2. Revenue Management System - Hoptym RMS (Completed + Integrated)
- Rate optimization
- Demand forecasting
- Competitive analysis
- Yield management
- **NEW: Configuration Integration**
  - `/api/rms/hotels/{id}/config-integration` - Get config from Configuration module
  - `/api/rms/hotels/{id}/sync-from-config` - Sync pricing from Configuration
  - `/api/rms/hotels/{id}/room-types-from-config` - Get room types for UI

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

### 6. Flowtym Data Hub (Completed - Phase 1 + Integrated)
- Universal data models for reservations, guests, transactions, rates, inventory
- 5 Connectors (MOCKED): Mews, Booking.com, Stripe, D-EDGE, Lighthouse
- Data normalization engine
- API gateway functionality
- **NEW: Configuration Integration**
  - `/api/datahub/hotels/{id}/config-integration` - Get config for connectors
  - `/api/datahub/hotels/{id}/pricing-for-distribution` - Get prices for OTA push
  - `/api/datahub/hotels/{id}/room-type-mapping/{ota}` - OTA room mappings
  - `/api/datahub/hotels/{id}/rate-plan-mapping/{ota}` - OTA rate mappings
- Frontend with 6 views: Overview (with Config section), Connectors, Sync, Data, API, Monitoring

### 7. Configuration Module (Completed)
**Purpose**: Central configuration hub serving as the "source of truth" for all hotel settings.

**Sections**:
1. **Hotel Profile**: General info, address, contact, regional settings
2. **Room Types**: Categories with codes, capacity, base prices, equipment
3. **Rooms**: Physical inventory with Excel import
4. **Rate Plans**: BAR and derived plans with automatic calculation
5. **Policies**: Cancellation and payment policies
6. **Users & Access**: RBAC system with 6 roles
7. **Advanced Settings**: Taxes, booking rules, overbooking, notifications

### 8. Shared ConfigService (NEW)
**Purpose**: Centralized service for all modules to access configuration data.

**Location**: `/app/backend/shared/config_service.py`

**Key Methods**:
- `get_full_config(hotel_id)` - Complete configuration in one call
- `get_room_types(hotel_id)` - Room types with counts
- `get_rate_plans(hotel_id)` - Rate plans with derivation rules
- `get_pricing_matrix(hotel_id)` - Pre-calculated prices
- `get_inventory_summary(hotel_id)` - Rooms by type/floor
- `calculate_derived_price(base, rule)` - Derived rate calculation
- `get_ota_room_type_mapping(hotel_id, ota)` - OTA mappings

**Shared API** (`/api/shared/config/*`):
- `/config/{hotel_id}/all` - Full configuration
- `/config/{hotel_id}/room-types` - Room types
- `/config/{hotel_id}/pricing-matrix` - Pricing matrix
- `/config/{hotel_id}/rms-data` - RMS specific data
- `/config/{hotel_id}/datahub-data` - Data Hub specific data

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
- [x] Configuration Module
- [x] **ConfigService & Integration (Phase A & B)**
  - [x] Central ConfigService
  - [x] Shared API endpoints
  - [x] RMS ↔ Configuration integration
  - [x] Data Hub ↔ Configuration integration
  - [x] React hooks for frontend modules

### Test Data Created
- 4 Room Types: STD (120€), SUP (160€), DLX (220€), STE (350€)
- 2 Rate Plans: BAR (base), NRF (-10% derived)
- 1 Room: 101 (Standard)
- 1 Cancellation Policy: FLEX
- 1 Payment Policy: PAY_ARR
- 1 User: Marie Dupont (Reception)

### In Progress / Upcoming (P1)
- [ ] PMS ↔ Configuration integration
- [ ] Booking Engine ↔ Configuration integration
- [ ] Data Hub - Phase 2 (Event Orchestration, Smart Caching)

### Future Tasks (P2)
- [ ] External API Marketplace
- [ ] Real-time webhooks for reservations
- [ ] OAuth2 advanced security

## Test Reports
- `/app/test_reports/iteration_17.json` - Data Hub Backend
- `/app/test_reports/iteration_18.json` - Data Hub Frontend
- `/app/test_reports/iteration_19.json` - Configuration Module (100%)
- `/app/test_reports/iteration_20.json` - Configuration Integration (100%)

## File Structure
```
/app/
├── backend/
│   ├── server.py
│   ├── shared/                 # NEW: Shared services
│   │   ├── __init__.py
│   │   ├── config_service.py   # Central ConfigService
│   │   └── routes.py           # Shared API routes
│   ├── config/                 # Configuration module
│   │   ├── routes.py
│   │   ├── models/
│   │   └── services/
│   ├── datahub/                # Data Hub module
│   │   └── routes.py           # +Integration endpoints
│   └── rms/                    # RMS module
│       └── routes.py           # +Integration endpoints
├── frontend/
│   └── src/
│       ├── hooks/
│       │   └── useConfigData.js  # NEW: React hooks
│       └── pages/
│           ├── config/
│           └── datahub/
└── memory/
    └── PRD.md
```

---
*Last updated: March 25, 2026*
*Version: 2.1 - Configuration Integration Complete (Phase A & B)*
