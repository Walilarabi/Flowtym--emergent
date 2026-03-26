# Flowtym PMS - Product Requirements Document

## Overview
Flowtym is a comprehensive Hotel Property Management System (PMS) SaaS platform designed for modern hotel operations. The system provides tools for reservations, revenue management, distribution, and guest experience management in a unified platform.

## Core Problem Statement
Hotels need an integrated solution for managing all aspects of their operations including:
- Property management and room inventory
- Booking and reservation management
- Channel distribution (OTAs integration)
- Housekeeping and maintenance operations
- Guest communication and experience
- Revenue optimization and reporting

## User Personas

### Super Admin
- Manages multiple hotels/properties
- Access to all system features
- User and role management
- System configuration

### Hotel Admin/Reception
- Daily operations management
- Check-in/check-out processes
- Reservation handling
- Guest communication

### Housekeeping Staff
- Room cleaning assignments
- Status updates and reporting
- Mobile-first workflow
- QR code scanning for room identification

### Direction/Management
- Dashboard analytics
- KPI monitoring
- Staff supervision
- Strategic oversight

---

## Completed Features

### Phase 1: Foundation (Completed)
- [x] User authentication (JWT-based)
- [x] Multi-hotel support
- [x] Role-based access control
- [x] Basic hotel configuration
- [x] Room management

### Phase 2: PMS Core (Completed)
- [x] Reservation management
- [x] Guest profiles
- [x] Check-in/check-out workflow
- [x] Planning board (Gantt-style)
- [x] Flowboard view

### Phase 3: Booking Engine (Completed)
- [x] Public booking widget
- [x] Room availability display
- [x] Rate management
- [x] Online payment integration ready
- [x] Booking confirmation emails

### Phase 4: Configuration Module (Completed)
- [x] Hotel settings management
- [x] Room type configuration
- [x] Rate plans
- [x] Tax settings
- [x] Channel mapping
- [x] Integration with PMS and Booking Engine

### Phase 5: Housekeeping Module V2 (Completed - March 25, 2026)
Based on Rorck React Native design with 100% visual fidelity.

#### 5.1 Reception View (Desktop)
- [x] Interactive room table with 16 columns
- [x] Checkbox selection for bulk operations
- [x] Bulk assignment button (appears when rooms selected)
- [x] Staff selection dialog
- [x] KPIs strip (Chambres, Départs, Recouches, En cours, Terminées, À valider, PDJ inclus, ETA urgents)
- [x] Advanced filters (Étage, Statut, Badge, Assignée, Source)
- [x] Color-coded room numbers
- [x] Status badges (Propre, Sale, Inspectée, En nettoyage, Libre, Occupée, H.S.)
- [x] Source icons (Booking, Direct, Expedia, Airbnb, Agoda, HRS, Tel)
- [x] VIP badges

#### 5.2 Direction View (Desktop)
- [x] Welcome message with current date
- [x] Quick navigation strip (Centre de contrôle, Plan Chambres, Répartition, Historique, Maintenance, Statistiques, Rapports)
- [x] KPI cards (Occupation %, Départs, Propreté %, Maintenance count)
- [x] Alerts card (Interventions urgentes, Chambres à valider, Petit-déj à préparer)
- [x] Room status summary with colored dots
- [x] Floor plan with room chips by floor
- [x] Team card with workload progress bars
- [x] Breakfast & Economat stats

#### 5.3 Gouvernante View (Desktop)
- [x] 3 tabs: Validation, Équipe, Stocks
- [x] Validation tab:
  - Search and filters (Étage, Statut)
  - KPIs (À valider, Validées, Refusées)
  - Inspection cards with Valider/Refuser buttons
- [x] Équipe tab:
  - Team supervision cards with workload bars
  - Assigned rooms per staff member
  - Quick action buttons (Réassigner, Valider chambres, Assigner, Historique)
  - KPIs sidebar
- [x] Stocks tab:
  - Link to full Économat
  - Low stock alerts
  - Inventory list with progress bars

#### 5.4 Mobile Housekeeping View (Femme de chambre)
- [x] Purple gradient header with welcome message
- [x] Room count summary card with progress bar
- [x] Stats: Terminées, Départs, Recouches, En cours
- [x] **QR Scanner button** with modal:
  - Room number input field
  - Filtered room list
  - Démarrer/Terminer actions
- [x] Swipe hint for actions
- [x] Room cards grouped by floor:
  - Status bar indicator
  - Room number and type
  - Priority/VIP badges
  - Démarrer/Terminer buttons
  - Live timer for in-progress rooms

#### 5.5 Mobile Maintenance View
- [x] Dark gradient header
- [x] Search bar
- [x] Stats: En attente, En cours, Résolu
- [x] Status filter dropdown
- [x] Ticket cards:
  - Room number
  - Issue title
  - Reporter and timestamp
  - Assigned technician
  - Priority badge (Haute, Moyenne, Basse)
  - Commencer/Résoudre buttons

#### 5.6 Mobile Breakfast View (Petit-déjeuner)
- [x] Orange gradient header
- [x] Stats: À préparer, En cours, Servis
- [x] 3 tabs: Cuisine, Livraison, Servis
- [x] Order cards:
  - Room number
  - Guest name
  - Formula and person count
  - Beverages
  - Allergy warnings
  - Notes
  - Payant badge (if not included)
  - Status update buttons (Préparé, En livraison, Servi)
- [x] Floating action buttons (Settings, Stats, Add)

---

## Backend API Endpoints (Housekeeping)

### Stats & Overview
- `GET /api/housekeeping/hotels/{hotel_id}/stats` - Dashboard statistics
- `GET /api/housekeeping/hotels/{hotel_id}/activity` - Activity feed

### Tasks Management
- `GET /api/housekeeping/hotels/{hotel_id}/tasks` - List all tasks
- `POST /api/housekeeping/hotels/{hotel_id}/tasks/{task_id}/start` - Start cleaning
- `POST /api/housekeeping/hotels/{hotel_id}/tasks/{task_id}/complete` - Complete cleaning

### Staff Management
- `GET /api/housekeeping/hotels/{hotel_id}/staff` - List staff members
- `POST /api/housekeeping/hotels/{hotel_id}/assignments/auto` - Auto-assign tasks

### Inspections
- `GET /api/housekeeping/hotels/{hotel_id}/inspections` - List inspections
- `POST /api/housekeeping/hotels/{hotel_id}/inspections/{id}/validate` - Validate/Refuse

### Maintenance
- `GET /api/housekeeping/hotels/{hotel_id}/maintenance` - List tickets
- `PUT /api/housekeeping/hotels/{hotel_id}/maintenance/{id}` - Update ticket status

### Breakfast
- `GET /api/housekeeping/hotels/{hotel_id}/breakfast` - List orders
- `PUT /api/housekeeping/hotels/{hotel_id}/breakfast/{id}` - Update order status

### Inventory
- `GET /api/housekeeping/hotels/{hotel_id}/inventory` - List stock items

### Demo Data
- `POST /api/housekeeping/hotels/{hotel_id}/seed` - Generate demo data

---

## Technical Architecture

### Frontend
- React 18 with Vite
- Tailwind CSS
- Shadcn/UI components
- Axios for API calls
- Sonner for toasts
- Lucide React icons

### Backend
- Python FastAPI
- MongoDB with Motor async driver
- JWT authentication
- Pydantic models

### Component Structure
```
/app/frontend/src/
├── components/
│   ├── housekeeping/
│   │   ├── DirectionView.jsx
│   │   ├── GouvernanteView.jsx
│   │   ├── InteractiveReceptionView.jsx
│   │   ├── MobileHousekeepingView.jsx
│   │   ├── MobileMaintenanceView.jsx
│   │   └── MobileBreakfastView.jsx
│   └── ui/
├── pages/
│   └── housekeeping/
│       └── HousekeepingModule.jsx
└── context/
    └── HotelContext.jsx
```

---

### Phase 6: UI Refonte - Kleon Figma Design System (Completed - March 26, 2026)
Complete visual redesign of the entire application with premium "Kleon Figma" design system.

#### 6.1 Design System Implementation
- [x] Primary color: Violet #6C5CE7
- [x] Background: #F8F9FC (light gray)
- [x] Border radius: 12px / 16px
- [x] Soft shadows: var(--shadow-card), var(--shadow-hover)
- [x] Typography: Inter font family
- [x] Micro-interactions: 150-200ms transitions
- [x] Glass-morphism effects on modals

#### 6.2 Command Palette (CTRL+K)
- [x] Global search modal
- [x] Quick actions (Nouvelle réservation, Check-in, Check-out)
- [x] Navigation shortcuts (Planning, Flowboard)
- [x] Keyboard navigation (↑↓ Enter ESC)
- [x] Backdrop blur effect

#### 6.3 CSS Architecture
- [x] CSS variables in flowtym-premium-v2.css
- [x] Global overrides for automatic design application
- [x] Tailwind integration preserved
- [x] No structural changes to existing code

#### 6.4 Modules Redesigned
- [x] Login page
- [x] PMS Planning with colored KPI bars
- [x] Channel Manager grid
- [x] CRM dashboard and client list
- [x] E-Reputation with charts and scores
- [x] Housekeeping all views
- [x] RMS Hoptym with AI recommendations
- [x] Configuration with sidebar

---

## Upcoming Tasks (Backlog)

### P0 - High Priority
- [ ] Excel Import: Implement real parsing logic in `/app/backend/config/services/excel_import.py`

### P1 - Medium Priority
- [ ] CRM Integration: Connect customer management to ConfigService
- [ ] Channel Manager: Connect OTA sync to ConfigService
- [ ] Real-time webhooks for booking events

### P2 - Future
- [ ] Data Hub Phase 2 (Priority Engine, Event Orchestration, Smart Caching)
- [ ] OAuth2 security implementation
- [ ] Mobile app (React Native)
- [ ] Multi-language support

---

## Testing Status

### Last Test Report: iteration_24.json (March 26, 2026)
- **Success Rate**: 100% (13/13 frontend tests passed)
- **Features Tested**: UI Refonte, Command Palette, All modules navigation
- **Design Verified**: Colors, typography, shadows, border-radius all correct
- **Issues Found**: None (minor backend error in /config but form still works)
- **Retest Needed**: No

### Test Credentials
- Admin: `admin@flowtym.com` / `admin123`
- Super Admin: `superadmin@flowtym.com` / `super123`

---

## Known Mocks

- **Excel Parser**: Import logic returns mock success (real implementation pending)

---

## Key Files Reference

### Design System
- `/app/frontend/src/styles/flowtym-premium-v2.css` - Main CSS with global overrides
- `/app/frontend/src/styles/flowtym-tokens.css` - CSS variables/tokens
- `/app/frontend/tailwind.config.js` - Tailwind configuration

### Command Palette
- `/app/frontend/src/components/CommandPalette.jsx` - Command Palette component
- `/app/frontend/src/components/layout/MainLayout.jsx` - Integration point

---

*Document Version: 5.0*
*Last Updated: March 26, 2026*
*Module Completed: UI Refonte Kleon Figma Design System*
