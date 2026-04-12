# FLOWTYM PMS - Product Requirements Document

## Vision
FLOWTYM est un PMS (Property Management System) SaaS hôtelier moderne, structuré en 8 piliers modulaires, avec une priorité sur le module Housekeeping.

## Architecture Technique

### Stack Actuelle (Migration Supabase en cours)
- **Backend Legacy (FastAPI)**: Port 8001 - API existante (en coexistence)
- **Backend Cible (NestJS)**: Port 8002 - API V2 Housekeeping (en coexistence)
- **Frontend (React/Vite)**: Port 3000 - Interface unifiée
- **Base de données**: Supabase PostgreSQL (migration depuis MongoDB)
- **Auth**: Supabase Auth (JWT natif, sessions gérées côté client)
- **Realtime**: Supabase Realtime (remplacement WebSocket NestJS)
- **Proxy**: FastAPI route `/api/v2/*` vers NestJS (legacy)

### Supabase
- URL: `https://mqdftrilwqdsnvryejsb.supabase.co`
- 37 tables PostgreSQL avec FK, enums, et RLS
- Enums: `user_role`, `room_status`, `reservation_status`, `cleaning_status`, etc.

### Décisions d'Architecture
1. **Migration Supabase**: Auth + Hotels + Rooms + Reservations migrés
2. **Coexistence temporaire**: FastAPI/NestJS gardés en parallèle pendant la migration
3. **Frontend Supabase-first**: AuthContext et HotelContext utilisent Supabase avec fallback API legacy

## Module Housekeeping - MVP Réception ✅

### Backend NestJS (TERMINÉ)
```
/app/backend-nest/
├── src/
│   ├── modules/
│   │   ├── housekeeping/  # Gestion tâches, inspections, WebSocket
│   │   ├── rooms/         # CRUD chambres, stats
│   │   ├── staff/         # Personnel housekeeping
│   │   ├── reports/       # (NEW) Signalements techniques ✅
│   │   ├── found-items/   # (NEW) Objets trouvés ✅
│   │   └── settings/      # (NEW) Configuration catégories ✅
```

### Endpoints V2 Disponibles
- `GET /api/v2/hotels/:hotelId/housekeeping/stats` - Statistiques temps réel
- `GET /api/v2/hotels/:hotelId/rooms` - Liste des chambres
- `GET /api/v2/hotels/:hotelId/staff` - Personnel
- `GET /api/v2/hotels/:hotelId/housekeeping/tasks` - Tâches du jour
- `POST /api/v2/hotels/:hotelId/housekeeping/seed` - Données démo
- `POST /api/v2/hotels/:hotelId/housekeeping/tasks/assign` - Assignation en masse
- `POST /api/v2/hotels/:hotelId/housekeeping/assignments/auto` - Auto-assignation
- WebSocket `/housekeeping` - Temps réel

### Endpoints Signalements (NEW) ✅
- `GET /api/v2/hotels/:hotelId/reports` - Liste des signalements
- `GET /api/v2/hotels/:hotelId/reports/stats` - Stats signalements
- `POST /api/v2/hotels/:hotelId/reports` - Créer signalement
- `POST /api/v2/hotels/:hotelId/reports/:id/take-over` - Prise en charge
- `POST /api/v2/hotels/:hotelId/reports/:id/resolve` - Résoudre

### Endpoints Objets Trouvés (NEW) ✅
- `GET /api/v2/hotels/:hotelId/found-items` - Liste des objets
- `GET /api/v2/hotels/:hotelId/found-items/stats` - Stats objets
- `POST /api/v2/hotels/:hotelId/found-items` - Déclarer objet
- `POST /api/v2/hotels/:hotelId/found-items/:id/consign` - Consigner
- `POST /api/v2/hotels/:hotelId/found-items/:id/return` - Restituer

### Endpoints Configuration (NEW) ✅
- `GET /api/v2/hotels/:hotelId/settings/categories` - Toutes catégories
- `GET /api/v2/hotels/:hotelId/settings/categories/reports` - Cat. signalements
- `GET /api/v2/hotels/:hotelId/settings/categories/found-items` - Cat. objets
- `POST /api/v2/hotels/:hotelId/settings/categories` - Créer catégorie
- `PUT /api/v2/hotels/:hotelId/settings/categories/:id` - Modifier catégorie
- `DELETE /api/v2/hotels/:hotelId/settings/categories/:id` - Supprimer catégorie

### Frontend React (TERMINÉ)
- `ReceptionViewV2.jsx` - Tableau interactif des chambres
- `ReportsTab.jsx` - (NEW) Onglet Signalements ✅
- `FoundItemsTab.jsx` - (NEW) Onglet Objets Trouvés ✅
- `CategoriesConfig.jsx` - (NEW) Config catégories ✅
- `DirectionViewV2.jsx` - (LEGACY) Ancien dashboard
- `useHousekeepingV2.js` - Hook avec WebSocket

### Module Direction - Phase 1 (NEW) ✅
```
/app/frontend/src/components/housekeeping/direction/
├── index.js                 # Exports
├── DirectionModule.jsx      # Navigation 10 onglets
└── DirectionDashboard.jsx   # Dashboard KPIs, Alertes, Activité
```

### Module Direction - Phase 2 (NEW) ✅
```
/app/frontend/src/components/housekeeping/direction/
├── PlanChambresView.jsx     # Vue par étage, détail chambre
└── RepartitionView.jsx      # Drag & drop, répartition auto
```

**Onglets Direction** :
1. ✅ Centre de contrôle (Dashboard complet)
2. ✅ Plan Chambres (Vue par étage, filtres, détail chambre)
3. ✅ Répartition (Drag & drop, répartition auto)
4. ✅ Objets trouvés (Fonctionnel)
5. ✅ Signalements (Fonctionnel)
6. ⏳ Historique (Phase 4)
7. ⏳ Maintenance (Phase 7)
8. ⏳ Statistiques (Phase 4)
9. ⏳ Rapports (Phase 6)
10. ✅ Configuration (Fonctionnel)

**Dashboard Direction** :
- KPIs circulaires : Occupation, Propreté, Départs, Maintenance
- Alertes du jour dynamiques
- Activité en temps réel
- État des chambres
- Housekeeping du jour
- Satisfaction clients

**Plan Chambres** :
- Compteurs de statuts cliquables (Propre, À nettoyer, En cours, Occupée, Inspection, H.S.)
- Vue par étage avec accordéon
- Recherche de chambre
- Modal détail chambre (type, étage, assignation, historique)
- Alertes chambres en retard

**Répartition** :
- Équipe du jour avec charge de travail par employé
- Drag & drop des chambres vers les employés
- Répartition automatique (équilibrage par temps estimé)
- Compteurs (Total, En attente, Assignées, Départs, Recouches)

## Données de Démo
- **40 chambres** sur 4 étages
- **9 membres staff** (4 femmes de chambre, 1 gouvernante, 2 maintenance, 2 petit-déj)
- **21 tâches** quotidiennes (8 départs, 13 recouches)
- **(NEW) 10 catégories de signalements** (WC bouché, Ampoule grillée, Clim en panne, etc.)
- **(NEW) 9 catégories d'objets trouvés** (Téléphone, Bijoux, Vêtements, etc.)

## Priorités Restantes

### ✅ COMPLÉTÉ - Module Housekeeping V2
- [x] **ReceptionViewV2** : Tableau interactif 40 chambres avec filtres
- [x] **DirectionViewV2** : Dashboard KPIs temps réel, plan chambres, équipe
- [x] **GouvernanteViewV2** : 3 onglets (Validation/Équipe/Stocks), Valider/Refuser
- [x] **MobileHousekeepingViewV2** : Timer, Démarrer/Terminer, progression
- [x] Tests complets passés (100% backend, 100% frontend)

### P1 - Améliorations en attente
- [ ] WebSockets temps réel (actuellement HTTP polling 30s)
- [ ] Scanner QR code physique
- [ ] Upload photos vers Object Storage
- [ ] Phase 4 Housekeeping — Historique & Statistiques (indice de confiance, performance employés)
- [ ] Phase 5 Housekeeping — Maintenance (préventive/corrective)

### P2 - Phases futures
- [ ] Rapports et Exports PDF (Housekeeping)
- [ ] Résolution WebSockets WSS (fonctionnel en HTTP Polling)
- [ ] Phase 2: Marketing, Guest Experience, Channel Manager
- [ ] Phase 3: Conciergerie IA, automatisations avancées

## Credentials Test
- Admin: `admin@flowtym.com` / `admin123` (Supabase Auth)
- Réception: `reception@hotel.com` / `reception123` (Supabase Auth)
- Gouvernante: `gouvernante@hotel.com` / `gouv123` (Supabase Auth)
- Femme de chambre: `femme1@hotel.com` / `femme123` (Supabase Auth)
- Maintenance: `maintenance@hotel.com` / `maint123` (Supabase Auth)
- Hotel ID: `fae266ac-2f4c-4297-af9f-b3b988d86c5b`

## Changelog

### 2026-04-12 - Migration Supabase (Étapes 1-4) + Flowboard + Housekeeping ✅
- ✅ **supabase-py** installé dans FastAPI + `@supabase/supabase-js` dans React
- ✅ **Seed Supabase** : 1 hôtel, 3 étages, 5 utilisateurs (Auth), 11 chambres, 7 réservations, settings, 11 tâches ménage
- ✅ **Auth migrée** : `AuthContext.jsx` utilise `supabase.auth.signInWithPassword()`
- ✅ **HotelContext migrée** : Hotels/Rooms depuis Supabase avec fallback legacy
- ✅ **Flowboard migrée** : KPIs (TO%, Arrivées, Départs, En séjour, Chambres libres, Ménage) calculés depuis Supabase + Realtime
- ✅ **Housekeeping migrée** : `useHousekeepingV2.jsx` utilise Supabase Realtime (`postgres_changes`) pour rooms, tasks, inspections
- ✅ **Actions Housekeeping** : startTask, completeTask, assignTasks, autoAssign via Supabase direct
- ✅ **Script SQL** : `/app/flowtym-sql-seed.sql` — script complet création tables + seed prêt pour SQL Editor
- ✅ **Tests** : Login, Flowboard, Housekeeping, PMS iframe fonctionnels

### 2026-04-12 - Intégration PMS Standalone dans Operations ✅
- ✅ **Backend**: Endpoints `/api/pms-app` et `/api/pms-plan3d` servent les fichiers HTML standalone
- ✅ **Frontend PMSModule**: Composant iframe wrapper (`/pms`) avec toolbar (refresh/external/fullscreen)
- ✅ **Isolation CSS/JS**: Le PMS s'exécute dans un iframe avec mode embedded (topbar masquée)
- ✅ **Layout adapté**: MainLayout retire le padding sur `/pms`, SubNavigation masquée sur `/pms` exact
- ✅ **Navigation PMS interne**: Planning, Réservations, Check-in/out, Clients, Tarifs, Rapports, Configuration
- ✅ **Tests**: 100% backend (9/9 pytest) + 100% frontend (iteration_46)

### 2026-03-31 - Notifications Push Gouvernante ✅
- ✅ **HousekeepingNotifications** : Composant complet avec icône de cloche
  - Panneau popover avec liste des notifications
  - Badge rouge animé quand nouvelles notifications
  - Toggle son (Web Audio API bip 800Hz)
  - Boutons Valider/Ignorer par notification
  - État vide "Aucune notification"
- ✅ **Backend NestJS** : Émission événement `cleaning_completed` 
  - housekeeping.gateway.ts : `emitCleaningCompletedNotification()`
  - housekeeping.service.ts : Appel à la complétion d'une tâche
- ✅ **Hook useHousekeepingV2** : Gestion état notifications
  - Écoute événement WebSocket `cleaning_completed`
  - Fonctions : clearAllNotifications, dismissNotification, toggleSound
- ⚠️ **WebSocket limitation** : Fallback HTTP polling (30s) car proxy K8s bloque WSS

### 2026-03-31 - Module Housekeeping V2 COMPLET ✅
- ✅ **GouvernanteViewV2** : Vue gouvernante complète avec 3 onglets
  - Onglet Validation : Inspections en attente avec Valider/Refuser
  - Onglet Équipe : 4 membres avec progression et tâches assignées
  - Onglet Stocks : 6 items inventaire avec alertes stock bas
  - Dialogues de validation (étoiles 1-5, commentaires) et refus (raison requise)
- ✅ **Intégration HousekeepingModule** : Toggle V2 Temps réel actif par défaut
- ✅ **Fix useHousekeepingV2.jsx** : Correction extension .js → .jsx et bloc try/catch WebSocket
- ✅ **Tests complets** : 100% backend (16 tests) + 100% frontend (toutes vues)

### 2026-03-31 - Vue Mobile & Dashboard Direction & Excel Import
- ✅ **MobileHousekeepingViewV2** : Vue mobile femme de chambre complète
  - Liste des tâches assignées avec progression
  - Timer en temps réel pendant le nettoyage
  - Boutons Démarrer/Terminer
  - Dialog de confirmation avec photo et notes
- ✅ **DirectionViewV2** : Dashboard Direction avec KPIs temps réel
  - 5 KPIs principaux (chambres, occupation, départs, recouches, propreté)
  - Plan des chambres interactif par étage
  - Panneau équipe avec progression individuelle
  - Actions rapides (Plan, Répartition, Contrôles, etc.)
- ✅ **Parser Excel** : API d'import déjà fonctionnelle
  - Template téléchargeable
  - Preview avant import
  - Validation des données

### 2026-03-31 - Restructuration Menu Operations
- ✅ **Mega Menu Operations** avec 3 blocs fonctionnels :
  - **PMS** (vert émeraude) : Dashboard, Planning, Réservations, Check-in/out, Groups, Simulation, Rapports
  - **Opérations Terrain** (orange) : Housekeeping, Maintenance, Staff, Consignes
  - **Achats & Conformité** (bleu) : Procurement & Stock, Compliance & Contrôles
- ✅ Design épuré avec colonnes séparées et codes couleurs
- ✅ Animation fluide au hover
- ✅ Footer avec légende et lien vue d'ensemble

### 2026-03-31 - Backend NestJS Housekeeping
- ✅ Backend NestJS opérationnel sur port 8002
- ✅ WebSocket Gateway temps réel
- ✅ Proxy FastAPI → NestJS sur /api/v2/*
- ✅ Compatibilité UUID hotel_id
- ✅ Données démo: 40 chambres, 9 staff, 21 tâches

### Précédent
- Module Configuration intégré au PMS
- Booking Engine connecté
- Page Login refaite
