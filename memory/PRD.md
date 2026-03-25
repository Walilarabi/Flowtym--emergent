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
- **Super Admin SaaS Back-Office** (multi-tenant, subscriptions, billing, contracts)
- **Channel Manager** (OTA connections, inventory sync, rate management)
- **CRM Module** (customer relationship management with AI analytics)
- Modern UI with violet/purple accent, white/light grey backgrounds
- Custom JWT authentication
- Payment integrations (SEPA direct debit, Stripe scaffolded)

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + TypeScript (CRM module)
- **Authentication**: Custom JWT-based auth
- **Payments**: SEPA Direct Debit (mandates), Stripe (scaffolded), Adyen, PayPal
- **PDF Generation**: ReportLab (contracts, SEPA mandates, invoices)
- **Object Storage**: Emergent Object Storage API
- **AI**: OpenAI GPT-4o via Emergent LLM Key (attrition analysis)

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
- [x] **PMS-CRM Auto Sync** (automatic client sync on new reservations)

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

### Staff Reporting - Variables de Paie (Complete - 2026-03-24)
- [x] **KPI Cards** (6 indicateurs):
  - Collaborateurs actifs
  - Heures totales
  - Heures sup. 25% (nouvelle distinction)
  - Heures sup. 50% (nouvelle distinction)
  - Congés payés (jours)
  - Maladie (jours)
- [x] **Period selector** avec navigation mois/année
- [x] **Tableau détail par collaborateur**:
  - Colonnes: H. Norm., H.Sup 25%, H.Sup 50%, CP, Maladie, PDF
  - Ligne TOTAUX avec calculs
- [x] **Graphique heures par service** avec légende majorations
- [x] **Actions Section**:
  - Bouton "Générer les rapports" (créé PDFs individuels + global + Excel + CSV)
  - Bouton "PDF Global" (téléchargement récapitulatif)
  - Bouton "Excel" (variables de paie structurées)
  - Bouton "CSV" (compatible logiciels de paie)
  - Bouton "Envoyer au comptable" (EMAIL MOCKÉ)
  - Bouton "Configuration" (modal paramétrage)
- [x] **Indicateurs de statut**: Rapports générés (date), Dernier envoi email
- [x] **Backend Payroll Reporting Module** (`/backend/payroll_reporting/`)
  - `models.py`: PayrollReportConfig, EmployeePayrollData, GlobalPayrollSummary
  - `pdf_generator.py`: Génération PDF avec ReportLab (fiches individuelles + récapitulatif)
  - `excel_generator.py`: Génération Excel/CSV avec openpyxl (3 feuilles: Variables, Résumé, Absences)
  - `email_service.py`: Service email MOCKÉ (simulation envoi)
  - `routes.py`: APIs REST complètes
- [x] **APIs Payroll Reports**:
  - `GET/PUT /hotels/{id}/payroll-reports/config` - Configuration (emails comptable, seuils h.sup, envoi auto)
  - `GET /hotels/{id}/payroll-reports/preview` - Prévisualisation sans génération
  - `POST /hotels/{id}/payroll-reports/generate` - Génération des fichiers
  - `GET /hotels/{id}/payroll-reports/reports` - Liste rapports générés
  - `GET /hotels/{id}/payroll-reports/reports/{id}/download/{type}` - Téléchargement (global_pdf, excel, csv, employee_pdf_{id})
  - `POST /hotels/{id}/payroll-reports/reports/{id}/send` - Envoi email (MOCK)
  - `GET /hotels/{id}/payroll-reports/email-logs` - Historique envois
- [x] **Configuration heures supplémentaires**:
  - Seuil 25%: configurable (défaut 8h)
  - Seuil 50%: au-delà du seuil 25%
  - Heures de nuit: 21h-6h avec majoration 25%
- [x] **Contenu PDF salarié**:
  - Infos salarié: Nom, Prénom, Poste, Service, Type contrat, Date entrée
  - Période: Mois, Année, Jours dans la période, Heures contractuelles
  - Temps de travail: H. normales, H. sup 25%, H. sup 50%, H. nuit, H. fériés
  - Absences: CP, Maladie, Non justifiées, Autres
  - Synthèse: Total heures à payer, Écart vs contrat
- [x] **PDF récapitulatif global**: KPIs, Absences totales, Par service, Détail tous salariés
- [x] **Modal Configuration**: Emails comptable, Seuil H.Sup, Jour envoi auto, Templates email
- [x] **Modal Envoi Email**: Warning MODE MOCK, Destinataires, Sujet, Corps, Aperçu pièces jointes

### Staff Recrutement (Complete - 2026-03-24)
- [x] Pipeline view (Kanban) - Nouveaux, Présélection, Entretien, Offre, Embauché
- [x] Job Offers CRUD with publish/unpublish
- [x] Candidates CRUD with status progression and rating
- [x] **AI Job Offer Generation (REAL GPT-4o)** - Generates professional French job descriptions
- [x] Filters: search, status, job offer
- [x] Interview scheduling (endpoint ready)

### Super Admin SaaS Module (Complete - 2026-03-24)
- [x] **Multi-tenant Architecture** - Isolated hotel data
- [x] **RBAC** - super_admin role with exclusive access
- [x] **Dashboard KPIs**: MRR, ARR, Churn Rate, Hotels count, Users count, Expiration alerts
- [x] **Plan Distribution Chart**: Basic, Pro, Premium, Enterprise
- [x] **Growth Chart**: 6-month hotel acquisition trend
- [x] **Hotels Management**: CRUD, search, status filter, suspend/activate
- [x] **Subscription Plans**:
  - Basic: €99/mo, 5 users, PMS only
  - Pro: €199/mo, 15 users, PMS + Staff + CRM
  - Premium: €349/mo, 30 users, PMS + Staff + CRM + RMS + Finance
  - Enterprise: €599/mo, unlimited users, all modules + API
- [x] **Payment Options**: Monthly or Annual (-5% discount)
- [x] **Trial Periods**: 15 days free OR 50% off first month
- [x] **PDF Generation**:
  - SaaS Contract (12 articles, signature block)
  - SEPA Direct Debit Mandate (RUM, IBAN, BIC)
  - Invoices (auto-generated)
- [x] **SEPA Mandates**: Create, sign, track status
- [x] **User Invitations**: Per hotel with role assignment
- [x] **Activity Logs**: Full audit trail of admin actions
- [x] **Support Mode**: Simulate user view by role (scaffolded)

### Subscription Catalog & Lifecycle Management (2026-03-24)
- [x] **Dynamic Subscription Plans Catalog**
  - Create/Edit/Delete plans with full configuration
  - 10 configurable modules: PMS, Staff, Channel Manager, CRM, RMS, E-Réputation, Operations, Booking Engine, Finance, Marketing
  - Feature toggles per module (e.g., Staff: Planning, Contrats, OCR, Export Paie)
  - Pricing: Monthly + Annual with configurable discount (%)
  - Trial period configurable per plan (0-30+ days)
  - Commitment period (months)
  - Max users configuration (-1 = unlimited)
  - Featured/Popular badge
- [x] **Hotel Subscription Lifecycle Management**
  - **Pause**: Suspend access, keep data, suspend billing
  - **Reactivate**: Restore access, resume billing with pause duration extension
  - **Upgrade**: Add modules/features, increase users, immediate or scheduled
  - **Downgrade**: Reduce plan with compatibility check
    - Block downgrade if excess users
    - Auto-disable excess users option
  - Subscription statuses: active, paused, trial, expired, cancelled
- [x] **Backend Modular Architecture** (`/backend/superadmin/`)
  - `catalog_models.py`: Plan, Module, Feature definitions
  - `catalog_routes.py`: Catalog CRUD + Lifecycle actions
  - Supports legacy (sa_hotels.subscription_plan) + new (sa_subscriptions) formats
- [x] **Frontend UI**
  - Catalog page: Plan cards with modules, pricing, subscriber count
  - Create/Edit modal: Module toggles with feature configuration
  - Subscriptions Lifecycle page: Stats (Total, Active, Trial, Paused, MRR)
  - Quick actions: Pause/Reactivate buttons
  - Status badges: Active (green), Trial (blue), Paused (amber), Expired (red)
  - Filters: Search, Status, Plan

### CRM Module (2026-03-24)
- [x] **Dashboard CRM** avec KPIs (Clients totaux, Taux rétention, Score NPS, CA par client)
- [x] **Alertes Temps Réel** (Chute rétention, Clients VIP sans interaction, Messages WhatsApp)
- [x] **Gestion Clients** avec liste, fiches détaillées, scores fidélité, tags
- [x] **Segmentation** des clients par critères
- [x] **Communications** (Inbox unifié)
- [x] **Réponses Auto** configurables
- [x] **Workflows** automatisés
- [x] **Campagnes** marketing
- [x] **Intelligence** (menu déroulant avec modules IA)
- [x] **Analytics** et rapports
- [x] **Connecteurs** (intégrations tierces)
- [x] **Configuration** du module
- [x] **Interface bilingue** FR/EN

### CRM Backend API (2026-03-24) - NEW
- [x] **Clients API** (`/api/crm/clients`)
  - LIST: GET with search, client_type, status, segment_id filters + pagination
  - GET: Single client with stays history
  - CREATE: POST with duplicate email validation
  - UPDATE: PUT partial updates
  - DELETE: Soft delete
- [x] **Segments API** (`/api/crm/segments`)
  - LIST: GET with dynamic client_count calculation
  - CREATE: POST with conditions for dynamic segments
  - UPDATE/DELETE: Standard CRUD
- [x] **Campaigns API** (`/api/crm/campaigns`)
  - LIST: GET with status filter
  - CREATE/UPDATE: Standard CRUD
  - LAUNCH: POST /{id}/launch - changes status to active, calculates target_count
- [x] **Workflows API** (`/api/crm/workflows`)
  - LIST: GET all workflows with execution counts
  - CREATE: POST with trigger (type, delay_hours) and actions array
  - UPDATE: Standard CRUD
  - TOGGLE: POST /{id}/toggle - activate/pause workflow
- [x] **Conversations & Messages API** (`/api/crm/conversations`, `/api/crm/messages`)
  - LIST conversations: GET with channel, status filters
  - GET messages: GET /{conversation_id}/messages
  - SEND message: POST creates conversation if needed, tracks unread
- [x] **Auto-Replies API** (`/api/crm/auto-replies`)
  - LIST: GET all auto-reply rules
  - CREATE: POST with trigger_keywords, channel, response_template
  - DELETE: Standard DELETE
- [x] **Alerts API** (`/api/crm/alerts`)
  - LIST: GET with unread_only filter
  - CREATE: POST with type, priority, client_id
  - MARK READ: POST /{id}/read
- [x] **Analytics API** (`/api/crm/analytics`)
  - GET: Returns total_clients, active_clients, new_clients_month, retention_rate, average_nps, average_ltv, top_segments, channel_distribution
- [x] **PMS Integration API**
  - SYNC: POST `/api/crm/sync-from-pms` - syncs clients from reservations
  - GET BY EMAIL: GET `/api/crm/client-by-email/{email}`
- [x] **Frontend API Service** (`/frontend/src/pages/crm/services/crmApi.ts`)
  - TypeScript service with full type definitions
  - Authenticated API calls using flowtym_token
  - All entities: Clients, Segments, Campaigns, Workflows, Conversations, Messages, AutoReplies, Alerts, Analytics

### Booking Engine Module (2026-03-24) - NEW
- [x] **Complete Booking Engine UI** injected from user-provided code
- [x] Self-contained component with internal navigation and styling
- [x] Accessible via `/booking` route and "Booking" tab in navigation
- [x] KPI dashboard, channel analysis, direct bookings metrics
- [x] Multiple sub-sections: Overview, Channels, Direct Bookings, Website, Campaigns, etc.
- [x] Note: Uses **MOCKED DATA** - no backend API integration

### Hoptym RMS Module (2026-03-24) - NEW
- [x] **Complete Hoptym RMS Backend & Frontend**
- [x] Navigation link "Hoptym" in TopNavigation
- [x] Accessible via `/rms` route

#### Backend Architecture
- [x] **MongoDB Collections**:
  - `rms_config`: Complete RMS configuration per hotel
  - `rms_recommendations`: AI-generated pricing recommendations
  - `rms_engine_runs`: Engine execution history
  - `rms_pricing_calendar`: 90-day pricing calendar
  - `rms_market_data`: Cached market data
  - `rms_recommendation_history`: Applied/dismissed recommendations

- [x] **6-Layer Pricing Engine** (`/app/backend/rms/engine.py`):
  - Layer 1: Base Price (historical ADR + seasonality + day of week)
  - Layer 2: Demand Adjustment (market demand signals)
  - Layer 3: Competition Adjustment (competitor rates intelligence)
  - Layer 4: Event Adjustment (special events, holidays)
  - Layer 5: Pickup/Booking Pace Adjustment
  - Layer 6: Optimization & Constraints (floor/ceiling)

- [x] **4 Pricing Strategies**:
  - Conservateur (Conservative): Stability-focused
  - Équilibré (Balanced): Optimal revenue/occupancy balance
  - Agressif (Aggressive): RevPAR maximization
  - Dynamique (Dynamic): AI-adaptive real-time

- [x] **5 Configurable Weight Factors**:
  - Demande (Demand): 25%
  - Concurrence (Competition): 20%
  - Événements (Events): 15%
  - Saisonnalité (Seasonality): 20%
  - Historique (Historical): 20%

- [x] **Autopilot Mode**:
  - Configurable confidence threshold (default 75%)
  - Max price change limit (default 15%)
  - Auto-apply recommendations above threshold

#### API Endpoints (19 endpoints)
- `GET /api/rms/hotels/{hotel_id}/config` - Complete RMS config
- `PUT /api/rms/hotels/{hotel_id}/config` - Update config
- `GET/PUT /api/rms/hotels/{hotel_id}/strategy` - Strategy management
- `GET/PUT /api/rms/hotels/{hotel_id}/weights` - Weight factors
- `GET /api/rms/hotels/{hotel_id}/recommendations` - Get recommendations
- `POST /api/rms/hotels/{hotel_id}/recommendations/{id}/apply` - Apply recommendation
- `POST /api/rms/hotels/{hotel_id}/recommendations/{id}/dismiss` - Dismiss recommendation
- `GET /api/rms/hotels/{hotel_id}/calendar` - Pricing calendar
- `PUT /api/rms/hotels/{hotel_id}/calendar/{date}` - Update date price
- `POST /api/rms/hotels/{hotel_id}/engine/run` - Run pricing engine
- `GET /api/rms/hotels/{hotel_id}/engine/status` - Engine status
- `GET /api/rms/hotels/{hotel_id}/kpis` - Current KPIs
- `GET /api/rms/hotels/{hotel_id}/market-data` - Market data
- `GET /api/rms/hotels/{hotel_id}/competitors` - Competitor rates
- `GET /api/rms/hotels/{hotel_id}/connectors/status` - All connector statuses
- `POST /api/rms/hotels/{hotel_id}/connectors/{connector}/sync` - Sync connector
- `PUT /api/rms/hotels/{hotel_id}/connectors/{connector}/config` - Update connector config
- `POST /api/rms/webhooks/receive` - Receive external webhooks

#### External Integrations (MOCKED)
- [x] **Lighthouse Connector** (`/app/backend/rms/integrations/lighthouse.py`):
  - Competitor rate shopping
  - Market demand forecasting
  - Hotel rankings & reviews
  - NOTE: Requires real API token for production
  
- [x] **D-EDGE Connector** (`/app/backend/rms/integrations/dedge.py`):
  - Channel performance analytics
  - Rate parity monitoring
  - Rate distribution push
  - NOTE: Requires real API key for production

#### Internal Flowtym Integrations
- [x] **PMS Connector**: Occupancy, reservations, historical data
- [x] **Channel Manager Connector**: Rate distribution, channel sync
- [x] **Booking Engine Connector**: Direct booking metrics, website analytics

#### Frontend Features
- [x] **3 Main Navigation Tabs**: Revenue, Intelligence, Configuration
- [x] **Sub-navigation** per tab
- [x] **KPI Cards**: RevPAR, ADR, Occupation, Revenu Total (with % change)
- [x] **Dashboard**: Weekly calendar preview, recommendations, competitor benchmark
- [x] **Calendar Page**: 31-day pricing grid
- [x] **Recommendations Page**: Apply/dismiss recommendations with impact estimates
- [x] **Competitors Page**: Real-time rate comparison table
- [x] **Strategy Page**: 4 clickable strategy cards
- [x] **Weights Page**: 5 sliders with total validation
- [x] **Autopilot Page**: Toggle with stats display
- [x] **Connections Page**: 5 connector cards with sync buttons

### CRM Advanced Analytics (2026-03-24) - NEW
- [x] **Advanced Analytics API** (`/api/crm/analytics/advanced`)
  - POST: Returns complete analytics with period filter (6m, 12m, custom)
  - Retention cohorts with 30d/60d/90d/180d rates
  - LTV by segment, LTV trend, top clients by LTV
  - Attrition risks with AI-powered analysis (GPT-4o)
  - Summary KPIs (total_clients, active_clients, high_risk_clients, average_ltv, total_revenue, retention_rate_avg)
- [x] **Attrition Analysis API** (`/api/crm/analytics/attrition`)
  - GET: Returns risk analysis with limit parameter
  - Risk scoring (0-100) with levels: critical, high, medium, low
  - AI-generated analysis and recommendations for high/critical risk clients
  - Risk factors identification (days since stay, frequency, loyalty score, LTV)
- [x] **Retention Cohorts API** (`/api/crm/analytics/retention-cohorts`)
  - GET: Returns cohort analysis by acquisition month
  - Period filter: 6m or 12m
- [x] **LTV Analytics API** (`/api/crm/analytics/ltv`)
  - GET: Returns LTV by segment, top clients, monthly trend
- [x] **Frontend Advanced Analytics Component**
  - New "Analytique Avancée" tab with 📈 icon
  - Period selector: 6 derniers mois | 12 derniers mois | Personnalisé
  - 4 sub-tabs: Vue d'ensemble | Rétention | Valeur Client (LTV) | Prédictions Attrition
  - KPI cards with live data
  - Interactive charts (Line for retention/trend, Bar for segments)
  - Attrition risk cards with AI analysis and recommendations
  - Export PDF (triggers print) + Export Excel (downloads CSV)

### Hotel Configuration & Management (2026-03-24)
- [x] **Hotel Management Page** (/superadmin/hotels/{hotelId})
  - 6 Tabs: Informations, Abonnement, Modules, Chambres, Équipements, Services
  - Complete hotel info form (name, address, stars, check-in/out times, etc.)
- [x] **Subscription Tab** - Complete subscription management for each hotel
  - Current plan display: Plan name, Price, Max users, Expiry date
  - **4 Quick Action Buttons**:
    - Upgrade / Downgrade: Change plan with price preview
    - Gérer les Modules: Toggle ON/OFF modules and features per hotel
    - Prolonger l'essai: Extend trial period with days and reason
    - Mettre en pause / Réactiver: Pause or reactivate subscription
  - Available plans display for reference
- [x] **Modules Tab** - View and configure active modules per hotel
  - List of enabled modules with feature count
  - Feature badges per module
  - Configure button opens management modal
- [x] **Chambres Tab** - Room configuration
  - Room Types CRUD (code, name, capacity, base price, amenities)
  - Rooms CRUD (number, floor, type, status)
  - Visual room grid with status colors
- [x] **Équipements Tab** - Equipment management
  - Equipment CRUD (name, category, quantity)
  - Categories: Room, Common area, Spa, Restaurant, Other
- [x] **Services Tab** - Hotel services management
  - Services CRUD (name, description, price, included flag)
  - Categories: General, Restaurant, Spa, Activities, Transport

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
- `POST /api/hotels/{id}/recruitment/job-offers/generate-ai` (**REAL GPT-4o**)
- `GET /api/hotels/{id}/recruitment/candidates`
- `POST /api/hotels/{id}/recruitment/candidates`
- `PUT /api/hotels/{id}/recruitment/candidates/{id}`
- `PATCH /api/hotels/{id}/recruitment/candidates/{id}/status`
- `PATCH /api/hotels/{id}/recruitment/candidates/{id}/rating`
- `DELETE /api/hotels/{id}/recruitment/candidates/{id}`
- `POST /api/hotels/{id}/recruitment/candidates/{id}/interviews`
- `GET /api/hotels/{id}/recruitment/pipeline-stats`

### Super Admin Hotel Configuration
- `GET /api/superadmin/hotels/{hotel_id}/config` - Get complete hotel config (info, rooms, equipment, services, subscription)
- `PUT /api/superadmin/hotels/{hotel_id}/config` - Update hotel info
- `GET/POST/PUT/DELETE /api/superadmin/hotels/{hotel_id}/room-types` - Room types CRUD
- `GET/POST/DELETE /api/superadmin/hotels/{hotel_id}/rooms` - Rooms CRUD
- `POST /api/superadmin/hotels/{hotel_id}/rooms/bulk` - Bulk create rooms
- `GET/POST/DELETE /api/superadmin/hotels/{hotel_id}/equipment` - Equipment CRUD
- `GET/POST/DELETE /api/superadmin/hotels/{hotel_id}/services` - Services CRUD
- `POST /api/superadmin/hotels/{hotel_id}/subscription/assign` - Assign plan to hotel
- `POST /api/superadmin/hotels/{hotel_id}/subscription/modify` - Upgrade/downgrade/add modules
- `POST /api/superadmin/hotels/{hotel_id}/subscription/extend-trial` - Extend trial period
- `GET /api/superadmin/hotels/{hotel_id}/subscription/modules` - Get current modules

### Super Admin Subscription Catalog
- `GET /api/superadmin/catalog/modules` - List all 10 configurable modules
- `GET /api/superadmin/catalog/plans` - List all subscription plans
- `POST /api/superadmin/catalog/plans` - Create new plan
- `PUT /api/superadmin/catalog/plans/{id}` - Update plan
- `DELETE /api/superadmin/catalog/plans/{id}` - Soft delete plan

### Super Admin Subscription Lifecycle
- `GET /api/superadmin/subscriptions/list` - List all hotel subscriptions (legacy + new)
- `GET /api/superadmin/subscriptions/{id}/detail` - Get subscription detail
- `POST /api/superadmin/subscriptions/{id}/pause` - Pause subscription
- `POST /api/superadmin/subscriptions/{id}/reactivate` - Reactivate paused subscription
- `POST /api/superadmin/subscriptions/{id}/upgrade/check` - Check upgrade compatibility
- `POST /api/superadmin/subscriptions/{id}/upgrade` - Apply upgrade
- `POST /api/superadmin/subscriptions/{id}/downgrade/check` - Check downgrade compatibility
- `POST /api/superadmin/subscriptions/{id}/downgrade` - Apply downgrade

---

## Database Collections
- users, hotels, rooms, reservations, clients, invoices, payments
- night_audits, staff_employees, staff_shifts, staff_time_entries
- staff_contracts, staff_payroll
- leave_config, leave_balances, leave_transactions, leave_requests
- public_holidays, holidays_worked
- **Super Admin**: sa_hotels, sa_subscriptions, sa_subscription_plans, sa_hotel_users, sa_sepa_mandates, sa_invoices, superadmin_logs

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
- [x] Staff Recrutement with REAL GPT-4o AI generation
- [x] **Super Admin SaaS Module** (multi-tenant, subscriptions, billing, PDF contracts, SEPA mandates)
- [x] **Subscription Catalog & Lifecycle** (dynamic plans, modules/features, pause/reactivate/upgrade/downgrade)
- [x] **CRM Module** (clients, segmentation, communications, workflows, campaigns, analytics, AI intelligence)

## P1 Features (Upcoming)
- [ ] **Connect Lighthouse to Real API** — requires user API token (currently mocked)
- [ ] **Connect D-EDGE to Real API** — requires user API key (currently mocked)
- [ ] **Intégrer envoi email réel** pour les rapports de paie (Resend/SendGrid - actuellement MOCKÉ)
- [ ] Document storage integration (upload employee documents to cloud via Object Storage API)
- [ ] Background scheduler for automated monthly CP accrual (CRON)
- [ ] Leave calendar visualization
- [ ] Super Admin: Stripe integration for real payment processing
- [ ] Connect Channel Manager to real OTA APIs (D-EDGE, SiteMinder)
- [ ] Connect Booking Engine module to backend API (currently uses mocked data)

## P2 Features (Future)
- [ ] Payment webhooks (Stripe/Adyen/PayPal production)
- [ ] Channel Manager API sync (D-EDGE, SiteMinder)
- [ ] Accounting export (Sage, QuickBooks, Xero)
- [ ] Multi-hotel support for regular users
- [ ] Mobile app
- [ ] Super Admin: Support mode with full user simulation

---

## Test Credentials
- Email: test.cp@hotel.com
- Password: test123

## Environment URLs
- Preview: https://flowtym-sync.preview.emergentagent.com
- Backend API: https://flowtym-sync.preview.emergentagent.com/api

## Key Files
- Backend: `/app/backend/server.py`
- **Hoptym RMS Backend Module**: `/app/backend/rms/` (routes.py, engine.py, models.py, integrations/)
- **Hoptym RMS Frontend**: `/app/frontend/src/pages/rms/RMS.jsx`
- **Booking Engine Module**: `/app/frontend/src/pages/booking/BookingEngine.jsx`
- **Super Admin Backend**: `/app/backend/superadmin/routes.py`, `/app/backend/superadmin/models.py`, `/app/backend/superadmin/pdf_generator.py`
- Frontend Entry: `/app/frontend/src/App.jsx`
- **Hotel Management**: `/app/frontend/src/pages/superadmin/SAHotelManagement.jsx`
- **Hotel Config Backend**: `/app/backend/superadmin/hotel_config_routes.py`
- **Super Admin Frontend**: `/app/frontend/src/pages/superadmin/SuperAdminApp.jsx`
- **Subscription Catalog**: `/app/frontend/src/pages/superadmin/SACatalog.jsx`
- **Subscription Lifecycle**: `/app/frontend/src/pages/superadmin/SASubscriptionsLifecycle.jsx`
- **Catalog Backend**: `/app/backend/superadmin/catalog_models.py`, `/app/backend/superadmin/catalog_routes.py`
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
- **Electronic Signature**: Contract/SEPA signature is manual (PDF download). DocuSign/HelloSign integration pending user API key.
- **Lighthouse Integration**: RMS module's Lighthouse connector generates realistic mock competitor/demand data. Requires real API token for production.
- **D-EDGE Integration**: RMS module's D-EDGE connector generates mock channel performance data. Requires real API key for production.
- **Booking Engine Module**: All data is hardcoded in the component. No backend API integration.
- **Payroll Email Service**: `/app/backend/payroll_reporting/email_service.py` simulates email sending, does not connect to real SMTP.

## Real Integrations (2026-03-24)
- **AI Job Offer Generation**: Uses GPT-4o via Emergent Universal Key. Generates professional French job descriptions, requirements, and salary suggestions.
- **PDF Generation**: ReportLab for SaaS contracts, SEPA mandates, and invoices.

## Test Credentials

### Regular User
- Email: admin@flowtym.com
- Password: admin123
- Hotel ID: 4f02769a-5f63-4121-bb97-a7061563d934

### Super Admin
- Email: superadmin@flowtym.com
- Password: super123
- Access: /superadmin route
- Registration requires secret key: flowtym-superadmin-2024
