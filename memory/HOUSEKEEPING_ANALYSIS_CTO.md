# ANALYSE HOUSEKEEPING - DOCUMENT CTO
## Migration Rorck (React Native/Supabase) → FLOWTYM (NestJS/Next.js/MongoDB)

**Date**: 30 Mars 2026  
**Version**: 1.0  
**Auteur**: CTO Analysis Agent  
**Source**: `/tmp/rorck_analysis/rork-hotel-reception-app-main/`

---

# 1. ANALYSE FONCTIONNELLE DU MODULE

## 1.1 Vue d'ensemble des rôles et interfaces

Le module Housekeeping de Rorck est conçu pour 6 rôles utilisateurs distincts avec des interfaces adaptées :

| Rôle | Interface | Appareil | Fonctionnalités clés |
|------|-----------|----------|---------------------|
| **Direction** | Desktop | Tablet/PC | Dashboard KPIs, Plan chambres, Supervision équipe, Objets trouvés, Alertes |
| **Réception** | Desktop | PC | Tableau complexe multi-colonnes, Gestion clients, Import CSV/Excel, Assignation masse |
| **Gouvernante** | Desktop + Mobile | Tablet | Validation inspections, Supervision équipe, Gestion stocks, Répartition chambres |
| **Femme de chambre** | Mobile | Smartphone | Liste chambres swipeable, Scan QR, Timer nettoyage, Checklist |
| **Maintenance** | Mobile | Smartphone | Tickets par priorité, Suivi interventions, Historique |
| **Petit-déjeuner** | Mobile | Smartphone | Flux cuisine→livraison→servi, Walk-in, Statistiques |

## 1.2 Fonctionnalités détaillées par module

### 1.2.1 Vue Direction (`direction/index.tsx`)

**Objectif** : Tableau de bord stratégique pour le directeur d'établissement

**Composants identifiés** :
- Header avec navigation rapide (10 icônes : Centre de contrôle, Plan chambres, Répartition, Objets trouvés, Signalements, Historique, Maintenance, Statistiques, Rapports, Configuration)
- 4 KPI Cards animées :
  - Taux d'occupation (%) avec barre de progression
  - Départs du jour
  - Taux de propreté (%)
  - Tickets maintenance en cours
- Alertes du jour (interventions urgentes, chambres à valider, PDJ à préparer)
- Widget statuts chambres (Libre, Occupée, Départ, Recouche, Hors service)
- Plan étages avec chips chambres interactives
- Widget Petit-déjeuner (à préparer, servis, payants)
- Widget Économat (consommations du jour)
- Carte équipe active (femmes de chambre avec charge de travail)
- Widget Objets trouvés avec paramètre délai de conservation
- Staff Forecast Card (prévisions équipe)

**Couleurs thématiques (FT constants)** :
```typescript
headerBg: '#0F172A'     // Fond header sombre
bg: '#F5F6FA'           // Fond application
surface: '#FFFFFF'      // Cartes
brand: '#4F6BED'        // Couleur principale
success: '#10B981'      // Vert
warning: '#F59E0B'      // Orange
danger: '#EF4444'       // Rouge
info: '#3B82F6'         // Bleu
teal: '#14B8A6'         // Turquoise
```

### 1.2.2 Vue Réception (`reception/index.tsx`)

**Objectif** : Interface complète de gestion des chambres pour la réception

**Structure complexe** :
- **Mode Plan** : Vue par étage avec chips chambres colorées (sélection multi-chambres)
- **Mode Tableau** : 16 colonnes avec interactions directes

**Colonnes tableau identifiées** :
1. Checkbox (sélection)
2. Chambre (numéro + badge statut coloré + type + catégorie + surface)
3. Statut propreté (Sale/En cours/Propre/Contrôlé) - cliquable
4. Client (nom + badge VIP/Prioritaire) - éditable
5. PAX (adultes + enfants)
6. Date arrivée
7. Date départ
8. ETA (heure arrivée estimée) - éditable
9. Source réservation (Direct, Booking, Expedia, Airbnb, etc.)
10. Housekeeping (Départ/Recouche/En cours/Terminé)
11. Gouvernante (À valider/Validé/Refusé)
12. Assignée (avatar + nom femme de chambre)
13. Vue / SDB (type de vue + salle de bain)
14. PDJ (toggle inclus/non inclus)
15. Temps (durée nettoyage en cours)
16. Actions (détails, départ, priorité)

**Fonctionnalités spéciales** :
- Filtres multiples (étage, statut, badge, assignée, source)
- Recherche instantanée
- Import CSV/Excel/PDF/Image avec OCR
- Sélection en masse + actions groupées (assignation, départ)
- Mini-calendrier pour édition dates
- KPI Strip horizontal scrollable (8 indicateurs)
- Dark mode toggle
- Sync PMS indicator

**Sources de réservation supportées** :
- Direct (téléphone, walk-in, email)
- OTA (Booking.com, Expedia, Airbnb, Hotels.com, Agoda, Trip.com)
- GDS (Sabre, Amadeus)
- Tour Operators
- Corporate

### 1.2.3 Vue Gouvernante (`gouvernante/index.tsx`)

**Objectif** : Supervision et validation pour la gouvernante

**3 onglets principaux** :
1. **Validation** : Liste des inspections à valider avec filtres
2. **Équipe** : Supervision des femmes de chambre avec charge de travail
3. **Stocks** : Gestion économat et alertes stock bas

**Composants clés** :
- Navigation rapide (Plan chambres, Répartition)
- Filtres (étage, statut inspection)
- KPI Strip (À valider, Validées, Refusées)
- Cartes inspection avec statut coloré
- Cartes équipe avec barre de charge et chips chambres assignées
- Liste chambres à faire groupées par étage
- Boutons d'action (Réassigner, Valider chambres, Assigner, Historique)
- Staff Forecast Card
- Lien vers économat complet

### 1.2.4 Vue Femme de chambre (`housekeeping/index.tsx`)

**Objectif** : Interface mobile optimisée terrain

**UX Mobile-first** :
- Hero section colorée avec salutation personnalisée
- Summary card (nombre chambres, progression %, stats)
- Scanner QR code (caméra native ou saisie manuelle)
- Filtres (Toutes, Départs, Recouches)
- Liste par étage avec SectionList
- Cartes swipeable :
  - Swipe droite → Commencer/Terminer nettoyage
  - Swipe gauche → NPD (Ne Pas Déranger)
- Badges visuels (VIP, Prioritaire, Départ, Recouche, NPD)
- Timer en temps réel pendant nettoyage
- Bouton play pour démarrage rapide
- Haptic feedback sur actions

**Gestion des statuts nettoyage** :
```typescript
cleaningStatus: 'none' | 'en_cours' | 'nettoyee' | 'validee' | 'refusee'
```

### 1.2.5 Vue Maintenance (`maintenance/index.tsx`)

**Objectif** : Gestion des tickets d'intervention

**Fonctionnalités** :
- Recherche
- Stats (En attente, En cours, Résolus)
- Filtre par statut
- Cartes tickets avec :
  - Bande latérale priorité (Rouge/Orange/Bleu)
  - Badge statut
  - Titre + description
  - Signalé par + date
  - Assigné à
- Navigation vers suivi maintenance (`maintenance-tracking`)

**Priorités** :
```typescript
priority: 'haute' | 'moyenne' | 'basse'
status: 'en_attente' | 'en_cours' | 'resolu'
```

### 1.2.6 Vue Petit-déjeuner (`breakfast/index.tsx`)

**Objectif** : Workflow cuisine → livraison → servi

**3 onglets** :
1. Cuisine (commandes à préparer)
2. Livraison (en cours de livraison)
3. Historique (servis)

**Fonctionnalités** :
- Stats en tête (À préparer, En cours, Servis)
- Cartes commandes avec :
  - Numéro chambre
  - Badge statut
  - Badge "Payant" si non inclus
  - Nom client
  - Formule + nombre personnes + boissons
  - Options spéciales (allergies, régimes)
  - Notes
  - Boutons d'action contextuel
- FAB flottant (Configuration, Statistiques, Walk-in)

**Statuts** :
```typescript
status: 'a_preparer' | 'prepare' | 'en_livraison' | 'servi'
```

---

# 2. ARCHITECTURE TECHNIQUE

## 2.1 Architecture cible (NestJS + Next.js + MongoDB)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE CIBLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Next.js 14    │    │   NestJS 10+    │    │   MongoDB 7+    │         │
│  │   (Frontend)    │◄───│   (Backend)     │◄───│   (Database)    │         │
│  │   App Router    │    │   REST + WS     │    │   Replica Set   │         │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘         │
│           │                      │                                          │
│           │    Server Actions    │    Prisma / Mongoose                     │
│           │    React Query       │    Bull MQ (Jobs)                        │
│           │    Zustand (State)   │    Socket.io (Realtime)                  │
│           │                      │                                          │
│  ┌────────┴────────┐    ┌────────┴────────┐    ┌─────────────────┐         │
│  │  Composants     │    │   Modules       │    │   Services      │         │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤         │
│  │ Direction       │    │ HousekeepingMod │    │ Redis Cache     │         │
│  │ Reception       │    │ MaintenanceMod  │    │ S3 Storage      │         │
│  │ Gouvernante     │    │ BreakfastMod    │    │ SendGrid Email  │         │
│  │ Mobile HK       │    │ AuthMod         │    │ Twilio SMS      │         │
│  │ Mobile Maint    │    │ WebSocketGateway│    │                 │         │
│  │ Mobile Breakfast│    │                 │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Stack technique détaillée

### Frontend (Next.js 14+)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "socket.io-client": "^4.7.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0"
  }
}
```

### Backend (NestJS 10+)

```json
{
  "dependencies": {
    "@nestjs/core": "^10.3.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/mongoose": "^10.0.0",
    "@nestjs/websockets": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "@nestjs/bull": "^10.0.0",
    "mongoose": "^8.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "passport": "^0.7.0",
    "@nestjs/jwt": "^10.2.0",
    "bcrypt": "^5.1.0"
  }
}
```

## 2.3 Structure de projet NestJS

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── config/
│   │   └── configuration.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── hotels/
│   │   │   ├── hotels.module.ts
│   │   │   ├── hotels.controller.ts
│   │   │   ├── hotels.service.ts
│   │   │   └── schemas/
│   │   │       └── hotel.schema.ts
│   │   │
│   │   ├── rooms/
│   │   │   ├── rooms.module.ts
│   │   │   ├── rooms.controller.ts
│   │   │   ├── rooms.service.ts
│   │   │   └── schemas/
│   │   │       └── room.schema.ts
│   │   │
│   │   ├── housekeeping/
│   │   │   ├── housekeeping.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── tasks.controller.ts
│   │   │   │   ├── inspections.controller.ts
│   │   │   │   ├── assignments.controller.ts
│   │   │   │   └── zones.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── tasks.service.ts
│   │   │   │   ├── inspections.service.ts
│   │   │   │   ├── assignments.service.ts
│   │   │   │   └── auto-assign.service.ts
│   │   │   ├── schemas/
│   │   │   │   ├── task.schema.ts
│   │   │   │   ├── inspection.schema.ts
│   │   │   │   ├── assignment.schema.ts
│   │   │   │   └── zone.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-task.dto.ts
│   │   │   │   ├── update-task.dto.ts
│   │   │   │   └── validate-inspection.dto.ts
│   │   │   └── gateways/
│   │   │       └── housekeeping.gateway.ts
│   │   │
│   │   ├── maintenance/
│   │   │   ├── maintenance.module.ts
│   │   │   ├── maintenance.controller.ts
│   │   │   ├── maintenance.service.ts
│   │   │   └── schemas/
│   │   │       └── maintenance-task.schema.ts
│   │   │
│   │   ├── breakfast/
│   │   │   ├── breakfast.module.ts
│   │   │   ├── breakfast.controller.ts
│   │   │   ├── breakfast.service.ts
│   │   │   └── schemas/
│   │   │       ├── breakfast-order.schema.ts
│   │   │       └── breakfast-config.schema.ts
│   │   │
│   │   ├── lost-found/
│   │   │   ├── lost-found.module.ts
│   │   │   ├── lost-found.controller.ts
│   │   │   ├── lost-found.service.ts
│   │   │   └── schemas/
│   │   │       └── lost-found-item.schema.ts
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.module.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── schemas/
│   │   │       ├── product.schema.ts
│   │   │       └── stock-movement.schema.ts
│   │   │
│   │   └── staff/
│   │       ├── staff.module.ts
│   │       ├── staff.controller.ts
│   │       ├── staff.service.ts
│   │       └── schemas/
│   │           └── staff.schema.ts
│   │
│   └── websocket/
│       ├── websocket.module.ts
│       └── websocket.gateway.ts
│
├── test/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

## 2.4 Structure de projet Next.js

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── housekeeping/
│   │       │   ├── page.tsx                    # Direction view
│   │       │   ├── reception/page.tsx          # Réception view
│   │       │   ├── gouvernante/page.tsx        # Gouvernante view
│   │       │   ├── mobile/page.tsx             # Femme de chambre view
│   │       │   ├── maintenance/page.tsx        # Maintenance view
│   │       │   ├── breakfast/page.tsx          # Petit-déjeuner view
│   │       │   ├── plan/page.tsx               # Plan hôtel
│   │       │   ├── assignments/page.tsx        # Répartition
│   │       │   ├── objets-trouves/page.tsx     # Objets trouvés
│   │       │   ├── signalements/page.tsx       # Signalements
│   │       │   └── historique/page.tsx         # Historique
│   │       └── ...
│   │
│   ├── components/
│   │   ├── ui/                                 # Shadcn components
│   │   ├── housekeeping/
│   │   │   ├── direction/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── AlertsWidget.tsx
│   │   │   │   ├── RoomStatusWidget.tsx
│   │   │   │   ├── FloorPlan.tsx
│   │   │   │   ├── TeamWidget.tsx
│   │   │   │   ├── LostFoundWidget.tsx
│   │   │   │   └── StaffForecastCard.tsx
│   │   │   ├── reception/
│   │   │   │   ├── RoomTable.tsx
│   │   │   │   ├── RoomTableRow.tsx
│   │   │   │   ├── FloorSection.tsx
│   │   │   │   ├── RoomChip.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   ├── KPIStrip.tsx
│   │   │   │   ├── SelectionBar.tsx
│   │   │   │   ├── ImportModal.tsx
│   │   │   │   ├── EditClientModal.tsx
│   │   │   │   ├── MiniCalendar.tsx
│   │   │   │   └── PdjToggle.tsx
│   │   │   ├── gouvernante/
│   │   │   │   ├── InspectionCard.tsx
│   │   │   │   ├── TeamCard.tsx
│   │   │   │   ├── StockWidget.tsx
│   │   │   │   └── ValidationTabs.tsx
│   │   │   ├── mobile/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── SummaryCard.tsx
│   │   │   │   ├── ScannerButton.tsx
│   │   │   │   ├── FilterTabs.tsx
│   │   │   │   ├── SwipeableRoomCard.tsx
│   │   │   │   └── ScanModal.tsx
│   │   │   ├── maintenance/
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── StatsRow.tsx
│   │   │   ├── breakfast/
│   │   │   │   ├── OrderCard.tsx
│   │   │   │   ├── TabsNav.tsx
│   │   │   │   └── FABMenu.tsx
│   │   │   └── shared/
│   │   │       ├── DeskRoomChip.tsx
│   │   │       ├── DeskTeamCard.tsx
│   │   │       ├── DeskKPI.tsx
│   │   │       └── DeskFloorSection.tsx
│   │   └── layout/
│   │       ├── TopNavigation.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── stores/
│   │   ├── housekeeping.store.ts
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   │
│   ├── hooks/
│   │   ├── useHousekeeping.ts
│   │   ├── useRooms.ts
│   │   ├── useStaff.ts
│   │   ├── useWebSocket.ts
│   │   └── useColors.ts
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   │
│   ├── types/
│   │   ├── housekeeping.ts
│   │   ├── room.ts
│   │   ├── staff.ts
│   │   └── index.ts
│   │
│   └── constants/
│       ├── colors.ts
│       ├── status-config.ts
│       └── flowtym.ts
│
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## 2.5 Stratégie de migration progressive

### Phase 1 : Coexistence (Semaines 1-4)
```
┌────────────────────────────────────────────────────────────────┐
│                  PHASE 1 : COEXISTENCE                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │ React/Vite  │         │   Next.js   │                       │
│  │ (Existant)  │         │  (Nouveau)  │                       │
│  │             │         │ Housekeeping│                       │
│  └──────┬──────┘         └──────┬──────┘                       │
│         │                       │                              │
│         └───────────┬───────────┘                              │
│                     │                                          │
│         ┌───────────▼───────────┐                              │
│         │ FastAPI + NestJS      │ ← API Gateway Nginx          │
│         │ (Coexistence)         │                              │
│         └───────────┬───────────┘                              │
│                     │                                          │
│         ┌───────────▼───────────┐                              │
│         │      MongoDB          │                              │
│         │   (Base commune)      │                              │
│         └───────────────────────┘                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Actions** :
1. Créer le projet NestJS en parallèle (`/app/backend-nest/`)
2. Partager la même base MongoDB
3. Créer les premiers modules NestJS (Auth, Housekeeping)
4. Configurer Nginx comme API Gateway pour router `/api/v2/*` vers NestJS
5. Créer la structure Next.js pour le module Housekeeping uniquement
6. Les autres modules restent sur React/Vite + FastAPI

### Phase 2 : Migration incrémentale (Semaines 5-12)
- Migrer module par module
- Tests de non-régression à chaque étape
- Feature flags pour basculer progressivement

### Phase 3 : Décommissionnement (Semaines 13-16)
- Retirer FastAPI
- Retirer React/Vite
- Architecture cible complète

---

# 3. MODÉLISATION MONGODB

## 3.1 Migration Supabase → MongoDB

Le schéma Supabase original utilise des ENUMS PostgreSQL et des UUID. MongoDB utilise des strings et ObjectId.

## 3.2 Schémas Mongoose

### 3.2.1 Room Schema

```typescript
// schemas/room.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

export enum RoomStatus {
  LIBRE = 'libre',
  OCCUPE = 'occupe',
  DEPART = 'depart',
  RECOUCHE = 'recouche',
  HORS_SERVICE = 'hors_service'
}

export enum CleaningStatus {
  NONE = 'none',
  EN_COURS = 'en_cours',
  NETTOYEE = 'nettoyee',
  VALIDEE = 'validee',
  REFUSEE = 'refusee'
}

export enum ClientBadge {
  NORMAL = 'normal',
  VIP = 'vip',
  PRIORITAIRE = 'prioritaire'
}

@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop({ required: true })
  room_type: string;  // Single, Double, Suite, etc.

  @Prop({ default: 'Classique' })
  room_category: string;

  @Prop({ type: Number })
  floor: number;

  @Prop({ type: Number, default: 20 })
  room_size: number;  // m²

  @Prop({ type: String, enum: RoomStatus, default: RoomStatus.LIBRE, index: true })
  status: RoomStatus;

  @Prop({ type: String, enum: CleaningStatus, default: CleaningStatus.NONE })
  cleaning_status: CleaningStatus;

  @Prop({ type: String, enum: ClientBadge, default: ClientBadge.NORMAL })
  client_badge: ClientBadge;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assigned_to: Types.ObjectId;

  @Prop()
  cleaning_assignee: string;  // Nom complet pour affichage

  @Prop({ type: Date })
  cleaning_started_at: Date;

  @Prop({ default: false })
  breakfast_included: boolean;

  @Prop()
  eta_arrival: string;  // "14:30"

  @Prop()
  view_type: string;  // Rue, Cour, Jardin

  @Prop()
  bathroom_type: string;  // Douche, Baignoire

  @Prop()
  booking_source: string;

  @Prop()
  cleanliness_status: string;  // sale, propre, controle

  @Prop()
  vip_instructions: string;

  // Réservation en cours (embedded)
  @Prop({ type: Object })
  current_reservation: {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    pms_reservation_id: string;
    preferences: string;
    status: string;
  };

  @Prop({ type: Number, default: 2 })
  capacity: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: Object, default: {} })
  dotation: Record<string, number>;

  @Prop({ default: true })
  is_active: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Index composites pour performance
RoomSchema.index({ hotel_id: 1, floor: 1 });
RoomSchema.index({ hotel_id: 1, status: 1, cleaning_status: 1 });
RoomSchema.index({ hotel_id: 1, assigned_to: 1 });
```

### 3.2.2 Housekeeping Task Schema

```typescript
// schemas/housekeeping-task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HousekeepingTaskDocument = HousekeepingTask & Document;

export enum TaskType {
  DEPART = 'depart',
  RECOUCHE = 'recouche',
  EN_COURS_SEJOUR = 'en_cours_sejour',
  GRANDE_FOUILLE = 'grande_fouille',
  MISE_EN_BLANC = 'mise_en_blanc',
  CONTROLE_RAPIDE = 'controle_rapide'
}

export enum TaskStatus {
  A_FAIRE = 'a_faire',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  INSPECTE = 'inspecte',
  A_REFAIRE = 'a_refaire',
  NON_REQUIS = 'non_requis'
}

@Schema({ timestamps: true, collection: 'housekeeping_tasks' })
export class HousekeepingTask {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  room_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop({ type: String, enum: TaskType, required: true })
  task_type: TaskType;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.A_FAIRE })
  status: TaskStatus;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assigned_to: Types.ObjectId;

  @Prop()
  assigned_to_name: string;

  @Prop({ type: Types.ObjectId, ref: 'HousekeepingAssignment' })
  assignment_id: Types.ObjectId;

  @Prop({ type: Date, required: true, default: Date.now })
  cleaning_date: Date;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Date })
  started_at: Date;

  @Prop({ type: Date })
  completed_at: Date;

  @Prop({ type: Number })
  duration_min: number;

  @Prop({ type: [Object], default: [] })
  products_used: { product_id: string; quantity: number }[];

  @Prop()
  notes: string;

  @Prop({ type: [String], default: [] })
  photos_before: string[];

  @Prop({ type: [String], default: [] })
  photos_after: string[];

  @Prop({ type: Object, default: {} })
  checklist: Record<string, boolean>;
}

export const HousekeepingTaskSchema = SchemaFactory.createForClass(HousekeepingTask);

HousekeepingTaskSchema.index({ hotel_id: 1, cleaning_date: 1 });
HousekeepingTaskSchema.index({ hotel_id: 1, status: 1 });
HousekeepingTaskSchema.index({ assigned_to: 1, status: 1 });
```

### 3.2.3 Inspection Schema

```typescript
// schemas/inspection.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InspectionDocument = Inspection & Document;

export enum InspectionResult {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  REFUSE = 'refuse'
}

@Schema({ timestamps: true, collection: 'inspections' })
export class Inspection {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  room_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop()
  room_type: string;

  @Prop({ type: Number })
  floor: number;

  @Prop({ type: Types.ObjectId, ref: 'HousekeepingTask' })
  cleaning_task_id: Types.ObjectId;

  @Prop({ required: true })
  cleaned_by: string;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  inspected_by: Types.ObjectId;

  @Prop()
  inspected_by_name: string;

  @Prop({ type: Date, required: true, default: Date.now })
  inspection_date: Date;

  @Prop({ type: Date, required: true })
  completed_at: Date;

  @Prop({ type: String, enum: InspectionResult, default: InspectionResult.EN_ATTENTE })
  status: InspectionResult;

  @Prop({ type: Object, default: {} })
  checklist: Record<string, { checked: boolean; notes: string }>;

  @Prop({ type: Number, min: 0, max: 100 })
  score: number;

  @Prop({ type: Number, min: 1, max: 5 })
  rating: number;

  @Prop()
  comments: string;

  @Prop()
  refused_reason: string;

  @Prop({ type: [String], default: [] })
  photos: string[];
}

export const InspectionSchema = SchemaFactory.createForClass(Inspection);

InspectionSchema.index({ hotel_id: 1, status: 1 });
InspectionSchema.index({ hotel_id: 1, inspection_date: 1 });
```

### 3.2.4 Staff Schema

```typescript
// schemas/staff.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffDocument = Staff & Document;

export enum StaffRole {
  DIRECTION = 'direction',
  GOUVERNANTE = 'gouvernante',
  RECEPTION = 'reception',
  FEMME_DE_CHAMBRE = 'femme_de_chambre',
  MAINTENANCE = 'maintenance',
  BREAKFAST_STAFF = 'breakfast_staff',
  ECONOMAT = 'economat'
}

@Schema({ timestamps: true, collection: 'staff' })
export class Staff {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ type: String, enum: StaffRole, required: true })
  role: StaffRole;

  @Prop({ default: true })
  active: boolean;

  // Spécifique femme de chambre
  @Prop({ type: Number, default: 12 })
  max_load: number;

  @Prop({ type: Number, default: 0 })
  current_load: number;

  @Prop({ type: Number, default: 0 })
  completed_today: number;

  @Prop()
  current_zone: string;

  @Prop({ type: [String], default: [] })
  preferred_floors: number[];

  @Prop()
  shift_start: string;  // "08:00"

  @Prop()
  shift_end: string;    // "16:00"

  @Prop()
  avatar_url: string;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

StaffSchema.index({ hotel_id: 1, role: 1 });
StaffSchema.index({ hotel_id: 1, active: 1 });
```

### 3.2.5 Maintenance Task Schema

```typescript
// schemas/maintenance-task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MaintenanceTaskDocument = MaintenanceTask & Document;

export enum MaintenancePriority {
  HAUTE = 'haute',
  MOYENNE = 'moyenne',
  BASSE = 'basse'
}

export enum MaintenanceStatus {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  RESOLU = 'resolu'
}

@Schema({ timestamps: true, collection: 'maintenance_tasks' })
export class MaintenanceTask {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room' })
  room_id: Types.ObjectId;

  @Prop()
  room_number: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop({ type: String, enum: MaintenancePriority, default: MaintenancePriority.MOYENNE })
  priority: MaintenancePriority;

  @Prop({ type: String, enum: MaintenanceStatus, default: MaintenanceStatus.EN_ATTENTE })
  status: MaintenanceStatus;

  @Prop()
  reported_by: string;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assigned_to: Types.ObjectId;

  @Prop()
  assigned_to_name: string;

  @Prop()
  location: string;

  @Prop({ type: [String], default: [] })
  photos_before: string[];

  @Prop({ type: [String], default: [] })
  photos_after: string[];

  @Prop({ type: Number })
  estimated_duration_min: number;

  @Prop({ type: Number })
  actual_duration_min: number;

  @Prop({ type: Date })
  started_at: Date;

  @Prop({ type: Date })
  resolved_at: Date;

  @Prop({ type: Date })
  reported_at: Date;

  @Prop({ default: false })
  is_periodic: boolean;

  @Prop()
  recurrence: string;
}

export const MaintenanceTaskSchema = SchemaFactory.createForClass(MaintenanceTask);

MaintenanceTaskSchema.index({ hotel_id: 1, status: 1 });
MaintenanceTaskSchema.index({ hotel_id: 1, priority: 1 });
```

### 3.2.6 Breakfast Order Schema

```typescript
// schemas/breakfast-order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BreakfastOrderDocument = BreakfastOrder & Document;

export enum BreakfastStatus {
  A_PREPARER = 'a_preparer',
  PREPARE = 'prepare',
  EN_LIVRAISON = 'en_livraison',
  SERVI = 'servi'
}

@Schema({ timestamps: true, collection: 'breakfast_orders' })
export class BreakfastOrder {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room' })
  room_id: Types.ObjectId;

  @Prop({ required: true })
  room_number: string;

  @Prop()
  guest_name: string;

  @Prop({ type: Number, default: 1 })
  person_count: number;

  @Prop({ type: Number, default: 1 })
  adults_count: number;

  @Prop({ type: Number, default: 0 })
  children_count: number;

  @Prop()
  formule: string;  // Classique, Buffet, Continental

  @Prop({ type: [String], default: [] })
  boissons: string[];

  @Prop({ type: [String], default: [] })
  options: string[];  // Sans gluten, Végan, etc.

  @Prop()
  notes: string;

  @Prop({ default: true })
  included: boolean;

  @Prop({ type: Number, default: 0 })
  total_price: number;

  @Prop({ type: String, enum: BreakfastStatus, default: BreakfastStatus.A_PREPARER })
  status: BreakfastStatus;

  @Prop({ type: Date })
  order_time: Date;

  @Prop({ type: Date })
  prepared_at: Date;

  @Prop({ type: Date })
  delivered_at: Date;

  @Prop({ type: Date })
  served_at: Date;

  @Prop({ default: false })
  billing_notification_sent: boolean;
}

export const BreakfastOrderSchema = SchemaFactory.createForClass(BreakfastOrder);

BreakfastOrderSchema.index({ hotel_id: 1, status: 1 });
BreakfastOrderSchema.index({ hotel_id: 1, createdAt: -1 });
```

### 3.2.7 Lost & Found Schema

```typescript
// schemas/lost-found-item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LostFoundItemDocument = LostFoundItem & Document;

export enum LostFoundStatus {
  EN_ATTENTE = 'en_attente',
  CONSIGNE = 'consigne',
  RESTITUE = 'restitue',
  DETRUIT = 'detruit',
  DON = 'don'
}

@Schema({ timestamps: true, collection: 'lost_found_items' })
export class LostFoundItem {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room' })
  room_id: Types.ObjectId;

  @Prop()
  room_number: string;

  @Prop({ required: true })
  item_description: string;

  @Prop()
  category: string;

  @Prop()
  location_found: string;

  @Prop({ type: Date, required: true, default: Date.now })
  found_date: Date;

  @Prop()
  found_by: string;

  @Prop({ type: String, enum: LostFoundStatus, default: LostFoundStatus.EN_ATTENTE })
  status: LostFoundStatus;

  @Prop()
  storage_location: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop()
  guest_name: string;

  @Prop()
  guest_contact: string;

  @Prop()
  returned_to: string;

  @Prop({ type: Date })
  returned_date: Date;

  @Prop()
  returned_id_scan_url: string;

  @Prop({ type: Date })
  destruction_date: Date;

  @Prop()
  notes: string;
}

export const LostFoundItemSchema = SchemaFactory.createForClass(LostFoundItem);

LostFoundItemSchema.index({ hotel_id: 1, status: 1 });
LostFoundItemSchema.index({ hotel_id: 1, found_date: -1 });
```

### 3.2.8 Housekeeping Assignment Schema

```typescript
// schemas/housekeeping-assignment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HousekeepingAssignmentDocument = HousekeepingAssignment & Document;

@Schema({ timestamps: true, collection: 'housekeeping_assignments' })
export class HousekeepingAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotel_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'HousekeepingZone' })
  zone_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  user_name: string;

  @Prop({ type: Date, required: true, default: Date.now })
  assignment_date: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Room' }], default: [] })
  room_ids: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  room_numbers: string[];

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;
}

export const HousekeepingAssignmentSchema = SchemaFactory.createForClass(HousekeepingAssignment);

HousekeepingAssignmentSchema.index({ hotel_id: 1, assignment_date: 1 });
HousekeepingAssignmentSchema.index({ user_id: 1, assignment_date: 1 });
```

---

# 4. USER FLOWS DÉTAILLÉS

## 4.1 Flow Direction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW DIRECTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CONNEXION                                                               │
│     └── Login → Vérif rôle "direction" → Redirect /housekeeping/direction   │
│                                                                             │
│  2. DASHBOARD MATINAL                                                       │
│     ├── Affichage auto des KPIs (API /stats)                               │
│     ├── Alertes urgentes mises en avant                                     │
│     └── Quick links vers actions prioritaires                               │
│                                                                             │
│  3. SUPERVISION ÉQUIPE                                                      │
│     ├── Clic "Équipe" → Liste femmes de chambre                            │
│     ├── Voir charge de travail en temps réel                               │
│     └── Clic membre → Détail + historique                                  │
│                                                                             │
│  4. PLAN CHAMBRES                                                          │
│     ├── Clic "Plan Chambres"                                               │
│     ├── Vue étages avec chips colorées                                     │
│     └── Clic chambre → Détail chambre                                      │
│                                                                             │
│  5. RÉPARTITION                                                            │
│     ├── Clic "Répartition"                                                 │
│     ├── Vue assignations actuelles                                         │
│     ├── Drag & drop pour modifier                                          │
│     └── Auto-assign si souhaité                                            │
│                                                                             │
│  6. OBJETS TROUVÉS                                                         │
│     ├── Clic "Objets trouvés"                                              │
│     ├── Liste avec statuts (En attente, Consigné, Restitué)               │
│     └── Modifier délai conservation                                        │
│                                                                             │
│  7. SIGNALEMENTS                                                           │
│     ├── Clic "Signalements"                                                │
│     └── Liste tickets maintenance non périodiques                          │
│                                                                             │
│  8. CONFIGURATION                                                          │
│     └── Paramètres hôtel + satisfaction                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Flow Réception

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW RÉCEPTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ARRIVÉE SUR PAGE                                                        │
│     ├── Chargement tableau complet (toutes chambres)                       │
│     ├── KPI Strip visible en haut                                          │
│     └── Mode par défaut : Plan (grille étages)                             │
│                                                                             │
│  2. FILTRAGE                                                                │
│     ├── Recherche texte (chambre, client)                                  │
│     ├── Filtres dropdown (étage, statut, badge, assignée, source)          │
│     └── Compteur chambres filtrées                                         │
│                                                                             │
│  3. CHANGEMENT VUE                                                          │
│     ├── Toggle Plan ↔ Tableau                                              │
│     └── Tableau = 16 colonnes scrollables horizontalement                  │
│                                                                             │
│  4. SÉLECTION MULTIPLE                                                      │
│     ├── Clic checkbox → Sélection unitaire                                 │
│     ├── Long press → Sélection rapide                                      │
│     ├── Clic "Sélectionner étage" → Sélection groupe                       │
│     └── Barre d'actions apparaît avec compteur                             │
│                                                                             │
│  5. ACTIONS EN MASSE                                                        │
│     ├── "Assigner" → Modal sélection staff → Confirmation                  │
│     └── "Départ" → Confirmation → MAJ statut chambres occupées             │
│                                                                             │
│  6. ÉDITION CLIENT                                                          │
│     ├── Clic cellule client → Modal édition                                │
│     ├── Modifier nom, dates, déplacer chambre                              │
│     └── Mini-calendrier pour dates                                         │
│                                                                             │
│  7. ÉDITIONS RAPIDES                                                        │
│     ├── Clic statut propreté → Dropdown changement                         │
│     ├── Clic ETA → Input heure arrivée                                     │
│     ├── Clic source → Dropdown sources                                     │
│     └── Toggle PDJ → Update direct                                         │
│                                                                             │
│  8. ACTIONS INDIVIDUELLES                                                   │
│     ├── Bouton œil → Détail chambre                                        │
│     ├── Bouton porte → Marquer départ                                      │
│     └── Bouton étoile → Toggle prioritaire                                 │
│                                                                             │
│  9. IMPORT CLIENTS                                                          │
│     ├── Clic "Import" → Modal choix format (CSV, Excel, PDF, Image)        │
│     └── Upload → Parsing → Preview → Confirmation                          │
│                                                                             │
│  10. NAVIGATION RAPIDE                                                      │
│      ├── Plan Chambres                                                      │
│      ├── Répartition                                                        │
│      ├── Signalements (avec badge compteur)                                │
│      └── Objets trouvés (avec badge compteur)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.3 Flow Gouvernante

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW GOUVERNANTE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ONGLET VALIDATION (Par défaut)                                          │
│     ├── Filtre étage + statut                                              │
│     ├── KPI Strip (À valider, Validées, Refusées)                          │
│     ├── Liste inspections à valider                                        │
│     │   ├── Carte avec bande couleur statut                                │
│     │   ├── Numéro chambre + type + étage                                  │
│     │   ├── Nettoyé par + heure                                            │
│     │   └── Badge statut (À valider/Validé/Refusé)                         │
│     └── Clic carte → Page validation avec checklist                        │
│                                                                             │
│  2. PAGE VALIDATION CHAMBRE                                                 │
│     ├── Info chambre + nettoyé par                                         │
│     ├── Photos avant/après                                                  │
│     ├── Checklist points de contrôle                                       │
│     ├── Score automatique                                                   │
│     ├── Note (1-5 étoiles)                                                 │
│     ├── Commentaires                                                        │
│     ├── Bouton "Valider" (vert)                                            │
│     └── Bouton "Refuser" (rouge) + raison obligatoire                      │
│                                                                             │
│  3. ONGLET ÉQUIPE                                                           │
│     ├── Liste femmes de chambre actives                                    │
│     │   ├── Nom + avatar                                                    │
│     │   ├── Barre charge travail (couleur selon %)                         │
│     │   ├── Nombre chambres assignées                                       │
│     │   └── Chips chambres cliquables                                       │
│     ├── Section "Chambres à faire" (non assignées)                         │
│     ├── Section "Toutes les chambres" par étage                            │
│     ├── Boutons d'action :                                                  │
│     │   ├── Réassigner (redistribution)                                     │
│     │   ├── Valider chambres (raccourci)                                   │
│     │   ├── Assigner (modal sélection)                                     │
│     │   └── Historique                                                      │
│     └── Staff Forecast Card                                                 │
│                                                                             │
│  4. ONGLET STOCKS                                                           │
│     ├── Lien vers économat complet                                         │
│     ├── Alerte stocks bas                                                   │
│     └── Liste inventaire avec barres niveau                                │
│                                                                             │
│  5. NAVIGATION RAPIDE                                                       │
│     ├── Plan Chambres                                                       │
│     └── Répartition                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.4 Flow Femme de chambre (Mobile)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW FEMME DE CHAMBRE (Mobile)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ARRIVÉE SUR L'APP                                                       │
│     ├── Hero section avec "Bonjour [Prénom]"                               │
│     ├── Summary Card :                                                      │
│     │   ├── Nombre total chambres assignées                                │
│     │   ├── Barre progression (% terminées)                                │
│     │   └── Mini stats (Terminées, Départs, Recouches, En cours)           │
│     └── Pull-to-refresh                                                     │
│                                                                             │
│  2. SCANNER QR CODE                                                         │
│     ├── Clic bouton scanner                                                │
│     ├── Ouverture caméra (ou input manuel sur web)                         │
│     ├── Scan QR chambre → Identification                                   │
│     ├── Si en cours → Proposition terminer                                 │
│     └── Si non commencé → Démarrage nettoyage + navigation détail          │
│                                                                             │
│  3. FILTRES RAPIDES                                                         │
│     ├── "Toutes" (nombre total)                                            │
│     ├── "Départs" (fond rouge clair)                                       │
│     └── "Recouches" (fond bleu clair)                                      │
│                                                                             │
│  4. LISTE CHAMBRES (SectionList par étage)                                  │
│     ├── Header étage avec compteur                                         │
│     └── Cartes swipeable :                                                  │
│         ├── Bande latérale couleur statut                                  │
│         ├── Numéro chambre (grand)                                         │
│         ├── Type chambre                                                    │
│         ├── Badges (VIP, Prioritaire, Départ, Recouche, NPD)              │
│         ├── Nom client (si occupée)                                        │
│         ├── Instructions VIP                                                │
│         ├── Bouton play (démarrage rapide)                                 │
│         └── Timer si en cours                                               │
│                                                                             │
│  5. SWIPE ACTIONS                                                           │
│     ├── Swipe droite (fond vert) :                                         │
│     │   ├── Si none/refusée → Commencer nettoyage                          │
│     │   └── Si en cours → Terminer nettoyage                               │
│     └── Swipe gauche (fond gris) :                                         │
│         └── Toggle NPD (Ne Pas Déranger)                                    │
│                                                                             │
│  6. DÉTAIL TÂCHE (après démarrage)                                          │
│     ├── Info chambre complète                                               │
│     ├── Timer en temps réel                                                 │
│     ├── Checklist tâches à cocher                                          │
│     ├── Prise photos avant/après                                            │
│     ├── Notes                                                               │
│     ├── Produits utilisés                                                   │
│     └── Bouton "Terminer" → Retour liste + MAJ statut                      │
│                                                                             │
│  7. FEEDBACK HAPTIQUE                                                       │
│     ├── Swipe validé → Vibration medium                                    │
│     ├── Nettoyage terminé → Vibration success                              │
│     └── Sélection → Vibration light                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.5 Flow Maintenance (Mobile)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW MAINTENANCE (Mobile)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ARRIVÉE SUR PAGE                                                        │
│     ├── Stats en ligne (En attente, En cours, Résolus)                     │
│     └── Filtre statut dropdown                                              │
│                                                                             │
│  2. LISTE TICKETS                                                           │
│     ├── Tri automatique : Priorité haute d'abord, puis statut              │
│     └── Cartes tickets :                                                    │
│         ├── Bande latérale priorité (rouge/orange/bleu)                    │
│         ├── Numéro chambre + badge statut                                  │
│         ├── Titre intervention                                              │
│         ├── Signalé par + date/heure                                       │
│         ├── Assigné à (si défini)                                          │
│         └── Badge priorité                                                  │
│                                                                             │
│  3. DÉTAIL TICKET                                                           │
│     ├── Clic carte → Page détail                                           │
│     ├── Description complète                                                │
│     ├── Photos signalement                                                  │
│     ├── Localisation                                                        │
│     ├── Bouton "Prendre en charge"                                         │
│     ├── Bouton "Terminer" + upload photos après                            │
│     └── Historique commentaires                                             │
│                                                                             │
│  4. SUIVI MAINTENANCE                                                       │
│     └── Bouton "Suivi" → Vue tableau de bord maintenance                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.6 Flow Petit-déjeuner (Mobile)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW PETIT-DÉJEUNER (Mobile)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ARRIVÉE SUR PAGE                                                        │
│     ├── Stats (À préparer, En cours, Servis)                               │
│     └── 3 onglets (Cuisine, Livraison, Historique)                         │
│                                                                             │
│  2. ONGLET CUISINE                                                          │
│     ├── Commandes status "a_preparer"                                       │
│     └── Cartes commandes :                                                  │
│         ├── Numéro chambre (grand)                                         │
│         ├── Badge statut                                                    │
│         ├── Badge "Payant" si non inclus                                   │
│         ├── Nom client                                                      │
│         ├── Formule + nombre personnes + boissons                          │
│         ├── Options spéciales (⚠️ allergies)                                │
│         ├── Notes (📝)                                                      │
│         └── Bouton "Préparé" (bleu)                                        │
│                                                                             │
│  3. ONGLET LIVRAISON                                                        │
│     ├── Commandes "prepare" ou "en_livraison"                              │
│     ├── Bouton "En livraison" (turquoise) si préparé                       │
│     └── Bouton "Servi" (vert) si en livraison                              │
│                                                                             │
│  4. ONGLET HISTORIQUE                                                       │
│     └── Commandes "servi" du jour                                           │
│                                                                             │
│  5. FAB ACTIONS                                                             │
│     ├── Configuration PDJ (tarifs, horaires)                               │
│     ├── Statistiques PDJ                                                    │
│     └── Walk-in (ajout commande manuelle)                                   │
│                                                                             │
│  6. WALK-IN                                                                 │
│     ├── Sélection chambre                                                   │
│     ├── Nombre personnes                                                    │
│     ├── Formule                                                             │
│     ├── Boissons                                                            │
│     ├── Options                                                             │
│     ├── Notes                                                               │
│     └── Inclus ou payant                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. UX/UI - TRANSPOSITION REACT NATIVE → REACT WEB

## 5.1 Design System (Migration des constantes)

### Couleurs principales (FT Constants)

```typescript
// constants/flowtym.ts
export const FT = {
  // Header & Navigation
  headerBg: '#0F172A',
  
  // Backgrounds
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFBFD',
  surfaceHover: '#F0F1F6',
  
  // Brand
  brand: '#4F6BED',
  brandSoft: 'rgba(79,107,237,0.07)',
  brandDark: '#3A50C7',
  
  // Text
  text: '#0F172A',
  textSec: '#475569',
  textMuted: '#94A3B8',
  
  // Borders
  border: '#E8ECF1',
  borderLight: '#F1F5F9',
  
  // Status
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.08)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.08)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.06)',
  info: '#3B82F6',
  infoSoft: 'rgba(59,130,246,0.08)',
  teal: '#14B8A6',
  tealSoft: 'rgba(20,184,166,0.08)',
  orange: '#F97316',
  
  // UI
  cardRadius: 14,
};

// Dark mode
export const FT_DARK = {
  headerBg: '#0B0E14',
  bg: '#0B0E14',
  surface: '#141820',
  surfaceAlt: '#1A1F2B',
  surfaceHover: '#222836',
  brand: '#6B83F2',
  brandSoft: 'rgba(107,131,242,0.12)',
  text: '#E2E8F0',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  border: '#1E2433',
  borderLight: '#171C26',
  // ... autres couleurs dark
};
```

### Configuration des statuts

```typescript
// constants/status-config.ts
export const ROOM_STATUS_CONFIG = {
  libre: { label: 'Libre', color: '#10B981', icon: '🟢' },
  occupe: { label: 'Occupée', color: '#3B82F6', icon: '🔵' },
  depart: { label: 'Départ', color: '#EF4444', icon: '🔴' },
  recouche: { label: 'Recouche', color: '#F59E0B', icon: '🟠' },
  hors_service: { label: 'Hors service', color: '#64748B', icon: '⚫' },
};

export const CLEANING_STATUS_CONFIG = {
  none: { label: 'À faire', color: '#94A3B8', icon: '⬜' },
  en_cours: { label: 'En cours', color: '#14B8A6', icon: '🧹' },
  nettoyee: { label: 'Terminé', color: '#F59E0B', icon: '✨' },
  validee: { label: 'Validé', color: '#10B981', icon: '✅' },
  refusee: { label: 'Refusé', color: '#EF4444', icon: '❌' },
};

export const BOOKING_SOURCE_CONFIG = {
  'Direct': { label: 'Direct', color: '#10B981', hasCommission: false, channelType: 'direct' },
  'Téléphone': { label: 'Téléphone', color: '#3B82F6', hasCommission: false, channelType: 'direct' },
  'Walk-in': { label: 'Walk-in', color: '#6366F1', hasCommission: false, channelType: 'direct' },
  'Email': { label: 'Email', color: '#8B5CF6', hasCommission: false, channelType: 'direct' },
  'Booking.com': { label: 'Booking.com', color: '#003580', hasCommission: true, channelType: 'ota' },
  'Expedia': { label: 'Expedia', color: '#FFCC00', hasCommission: true, channelType: 'ota' },
  'Airbnb': { label: 'Airbnb', color: '#FF5A5F', hasCommission: true, channelType: 'ota' },
  // ... autres sources
};
```

## 5.2 Composants UI clés

### Tailwind CSS équivalents des styles React Native

| React Native | Tailwind CSS |
|-------------|--------------|
| `flexDirection: 'row'` | `flex-row` |
| `alignItems: 'center'` | `items-center` |
| `justifyContent: 'space-between'` | `justify-between` |
| `borderRadius: 14` | `rounded-[14px]` ou `rounded-xl` |
| `paddingHorizontal: 16` | `px-4` |
| `paddingVertical: 12` | `py-3` |
| `backgroundColor: '#FFF'` | `bg-white` |
| `shadowOpacity: 0.06` | `shadow-sm` |
| `gap: 8` | `gap-2` |

### Composants à créer

1. **SwipeableRoomCard** (Mobile)
   - Utiliser `framer-motion` pour le drag
   - Alternatives : `react-swipeable` ou gestes custom

2. **DeskRoomChip** (Desktop)
   - Chip coloré cliquable
   - Badge superposé pour statuts

3. **KPICard**
   - Animation compteur avec `framer-motion`
   - Icône + valeur + label + barre progression optionnelle

4. **MiniCalendar**
   - Composant calendrier inline pour sélection dates

5. **SectionList** (Mobile)
   - Grouper par étage avec headers sticky
   - `react-window` si liste longue

## 5.3 Responsive Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BREAKPOINTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mobile (< 640px)   : Vues Femme de chambre, Maintenance, Petit-déj        │
│  Tablet (640-1024px): Gouvernante, Direction (layout adapté)               │
│  Desktop (> 1024px) : Réception (tableau complet), Direction (full)        │
│                                                                             │
│  STRATÉGIE :                                                                │
│  - Mobile-first pour vues terrain                                           │
│  - Desktop-first pour vues réception/direction                             │
│  - Composants partagés avec props `variant`                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. PERFORMANCE & TEMPS RÉEL

## 6.1 Optimisations Backend

### Caching (Redis)

```typescript
// Stratégie de cache
const CACHE_KEYS = {
  HOTEL_STATS: (hotelId: string) => `hotel:${hotelId}:stats`,
  ROOMS_LIST: (hotelId: string) => `hotel:${hotelId}:rooms`,
  TASKS_TODAY: (hotelId: string, date: string) => `hotel:${hotelId}:tasks:${date}`,
};

const CACHE_TTL = {
  STATS: 30,      // 30 secondes (données très dynamiques)
  ROOMS: 60,      // 1 minute
  TASKS: 30,      // 30 secondes
  STAFF: 300,     // 5 minutes
};
```

### Indexes MongoDB

```javascript
// Indexes critiques pour performance
db.rooms.createIndex({ hotel_id: 1, status: 1, cleaning_status: 1 })
db.rooms.createIndex({ hotel_id: 1, floor: 1 })
db.rooms.createIndex({ hotel_id: 1, assigned_to: 1 })

db.housekeeping_tasks.createIndex({ hotel_id: 1, cleaning_date: 1, status: 1 })
db.housekeeping_tasks.createIndex({ assigned_to: 1, status: 1, cleaning_date: 1 })

db.inspections.createIndex({ hotel_id: 1, status: 1, inspection_date: 1 })

db.maintenance_tasks.createIndex({ hotel_id: 1, status: 1, priority: 1 })

db.breakfast_orders.createIndex({ hotel_id: 1, status: 1, createdAt: -1 })
```

### Aggregation optimisée pour stats

```typescript
// Service NestJS - Stats optimisées
async getHotelStats(hotelId: string): Promise<HotelStats> {
  const cacheKey = CACHE_KEYS.HOTEL_STATS(hotelId);
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [roomStats, taskStats, inspectionStats] = await Promise.all([
    this.roomModel.aggregate([
      { $match: { hotel_id: new Types.ObjectId(hotelId) } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        libre: { $sum: { $cond: [{ $eq: ['$status', 'libre'] }, 1, 0] } },
        occupe: { $sum: { $cond: [{ $eq: ['$status', 'occupe'] }, 1, 0] } },
        depart: { $sum: { $cond: [{ $eq: ['$status', 'depart'] }, 1, 0] } },
        recouche: { $sum: { $cond: [{ $eq: ['$status', 'recouche'] }, 1, 0] } },
        hors_service: { $sum: { $cond: [{ $eq: ['$status', 'hors_service'] }, 1, 0] } },
        en_cours: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'en_cours'] }, 1, 0] } },
        nettoyee: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'nettoyee'] }, 1, 0] } },
        validee: { $sum: { $cond: [{ $eq: ['$cleaning_status', 'validee'] }, 1, 0] } },
      }}
    ]),
    this.taskModel.countDocuments({ hotel_id: hotelId, status: 'a_faire' }),
    this.inspectionModel.countDocuments({ hotel_id: hotelId, status: 'en_attente' }),
  ]);

  const stats = { ...roomStats[0], pendingTasks: taskStats, pendingInspections: inspectionStats };
  await this.redis.setex(cacheKey, CACHE_TTL.STATS, JSON.stringify(stats));
  return stats;
}
```

## 6.2 WebSocket Gateway (Temps réel)

```typescript
// websocket/housekeeping.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/housekeeping',
  cors: { origin: '*' },
})
export class HousekeepingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private hotelRooms = new Map<string, Set<string>>(); // hotelId -> Set<socketId>

  handleConnection(client: Socket) {
    const hotelId = client.handshake.query.hotelId as string;
    if (hotelId) {
      client.join(`hotel:${hotelId}`);
      if (!this.hotelRooms.has(hotelId)) {
        this.hotelRooms.set(hotelId, new Set());
      }
      this.hotelRooms.get(hotelId)!.add(client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const hotelId = client.handshake.query.hotelId as string;
    if (hotelId && this.hotelRooms.has(hotelId)) {
      this.hotelRooms.get(hotelId)!.delete(client.id);
    }
  }

  // Émettre mise à jour chambre
  emitRoomUpdate(hotelId: string, room: any) {
    this.server.to(`hotel:${hotelId}`).emit('room:updated', room);
  }

  // Émettre nouvelle inspection
  emitInspectionCreated(hotelId: string, inspection: any) {
    this.server.to(`hotel:${hotelId}`).emit('inspection:created', inspection);
  }

  // Émettre progression nettoyage
  emitCleaningProgress(hotelId: string, taskId: string, progress: any) {
    this.server.to(`hotel:${hotelId}`).emit('cleaning:progress', { taskId, progress });
  }

  // Émettre stats mises à jour
  emitStatsUpdate(hotelId: string, stats: any) {
    this.server.to(`hotel:${hotelId}`).emit('stats:updated', stats);
  }

  @SubscribeMessage('subscribe:room')
  handleSubscribeRoom(client: Socket, roomId: string) {
    client.join(`room:${roomId}`);
    return { subscribed: true, roomId };
  }

  @SubscribeMessage('unsubscribe:room')
  handleUnsubscribeRoom(client: Socket, roomId: string) {
    client.leave(`room:${roomId}`);
    return { unsubscribed: true, roomId };
  }
}
```

## 6.3 Frontend - Hook WebSocket

```typescript
// hooks/useHousekeepingSocket.ts
import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useHousekeepingStore } from '@/stores/housekeeping.store';

let socket: Socket | null = null;

export function useHousekeepingSocket(hotelId: string) {
  const { updateRoom, addInspection, updateStats } = useHousekeepingStore();

  useEffect(() => {
    if (!hotelId) return;

    socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/housekeeping`, {
      query: { hotelId },
      transports: ['websocket'],
    });

    socket.on('room:updated', (room) => {
      updateRoom(room);
    });

    socket.on('inspection:created', (inspection) => {
      addInspection(inspection);
    });

    socket.on('stats:updated', (stats) => {
      updateStats(stats);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [hotelId, updateRoom, addInspection, updateStats]);

  const subscribeRoom = useCallback((roomId: string) => {
    socket?.emit('subscribe:room', roomId);
  }, []);

  const unsubscribeRoom = useCallback((roomId: string) => {
    socket?.emit('unsubscribe:room', roomId);
  }, []);

  return { subscribeRoom, unsubscribeRoom };
}
```

## 6.4 State Management (Zustand)

```typescript
// stores/housekeeping.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Room {
  id: string;
  room_number: string;
  status: string;
  cleaning_status: string;
  // ... autres champs
}

interface HousekeepingState {
  rooms: Room[];
  selectedRoomIds: Set<string>;
  inspections: any[];
  stats: any;
  filters: {
    status: string;
    floor: number | 'all';
    assignee: string;
  };
  
  // Actions
  setRooms: (rooms: Room[]) => void;
  updateRoom: (room: Partial<Room> & { id: string }) => void;
  toggleRoomSelection: (roomId: string) => void;
  clearSelection: () => void;
  setFilter: (key: string, value: any) => void;
  addInspection: (inspection: any) => void;
  updateStats: (stats: any) => void;
}

export const useHousekeepingStore = create<HousekeepingState>()(
  devtools(
    persist(
      (set, get) => ({
        rooms: [],
        selectedRoomIds: new Set(),
        inspections: [],
        stats: null,
        filters: {
          status: 'all',
          floor: 'all',
          assignee: 'all',
        },

        setRooms: (rooms) => set({ rooms }),

        updateRoom: (updatedRoom) => set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
          ),
        })),

        toggleRoomSelection: (roomId) => set((state) => {
          const newSet = new Set(state.selectedRoomIds);
          if (newSet.has(roomId)) {
            newSet.delete(roomId);
          } else {
            newSet.add(roomId);
          }
          return { selectedRoomIds: newSet };
        }),

        clearSelection: () => set({ selectedRoomIds: new Set() }),

        setFilter: (key, value) => set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

        addInspection: (inspection) => set((state) => ({
          inspections: [inspection, ...state.inspections],
        })),

        updateStats: (stats) => set({ stats }),
      }),
      {
        name: 'housekeeping-storage',
        partialize: (state) => ({ filters: state.filters }),
      }
    )
  )
);
```

## 6.5 Métriques de performance cibles

| Métrique | Cible | Mesure |
|----------|-------|--------|
| TTFB (Time to First Byte) | < 200ms | Backend API |
| LCP (Largest Contentful Paint) | < 1.5s | Page Direction |
| FID (First Input Delay) | < 100ms | Interactions |
| CLS (Cumulative Layout Shift) | < 0.1 | Stabilité visuelle |
| Refresh temps réel | < 500ms | WebSocket → UI |
| Tableau 100 chambres | < 2s render | Vue Réception |

---

# 7. ROADMAP IMPLÉMENTATION

## Phase 1 : Foundation (Semaines 1-2)
- [ ] Setup projet NestJS avec structure modules
- [ ] Configuration MongoDB + Mongoose schemas
- [ ] Module Auth (JWT, guards)
- [ ] Setup projet Next.js 14 avec App Router
- [ ] Design system Tailwind + composants de base

## Phase 2 : Core Housekeeping (Semaines 3-6)
- [ ] Backend : Modules Rooms, Tasks, Staff
- [ ] Backend : WebSocket Gateway
- [ ] Frontend : Vue Direction
- [ ] Frontend : Vue Gouvernante
- [ ] Frontend : Vue Mobile Femme de chambre

## Phase 3 : Réception & Features (Semaines 7-10)
- [ ] Backend : Inspections, Assignments
- [ ] Frontend : Vue Réception (tableau complexe)
- [ ] Frontend : Import CSV/Excel
- [ ] Intégration temps réel complète

## Phase 4 : Modules annexes (Semaines 11-14)
- [ ] Backend : Maintenance, Breakfast, Lost & Found
- [ ] Frontend : Vues Mobile Maintenance & Breakfast
- [ ] Frontend : Économat / Stocks
- [ ] Tests E2E

## Phase 5 : Polish & Migration (Semaines 15-16)
- [ ] Migration données production
- [ ] Tests de charge
- [ ] Documentation API
- [ ] Décommissionnement ancien backend

---

# 8. ANNEXES

## 8.1 Fichiers sources analysés

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `/expo/app/(tabs)/direction/index.tsx` | 543 | Vue Direction complète |
| `/expo/app/(tabs)/reception/index.tsx` | 2000+ | Vue Réception tableau |
| `/expo/app/(tabs)/gouvernante/index.tsx` | 577 | Vue Gouvernante 3 onglets |
| `/expo/app/(tabs)/housekeeping/index.tsx` | 1413 | Vue Mobile Femme de chambre |
| `/expo/app/(tabs)/maintenance/index.tsx` | 238 | Vue Mobile Maintenance |
| `/expo/app/(tabs)/breakfast/index.tsx` | 296 | Vue Mobile Petit-déjeuner |
| `/supabase/schema.sql` | 909 | Schéma DB complet |

## 8.2 Dépendances externes identifiées

- `expo-camera` → Web : `@mediapipe/camera_utils` ou `react-webcam`
- `expo-haptics` → Non applicable web (ignorer)
- `expo-router` → `next/navigation`
- `react-native-gesture-handler` → `framer-motion` ou `@use-gesture/react`

---

*Document généré le 30 Mars 2026*  
*Basé sur l'analyse du code source Rorck v1.0*
