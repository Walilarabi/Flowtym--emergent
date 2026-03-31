# FLOWTYM PMS - Product Requirements Document

## Vision
FLOWTYM est un PMS (Property Management System) SaaS hôtelier moderne, structuré en 8 piliers modulaires, avec une priorité sur le module Housekeeping.

## Architecture Technique

### Stack Actuelle (Hybride/Transition)
- **Backend Legacy (FastAPI)**: Port 8001 - API existante pour PMS, Auth, Booking
- **Backend Cible (NestJS)**: Port 8002 - API V2 pour Housekeeping avec WebSocket temps réel
- **Frontend (React/Vite)**: Port 3000 - Interface unifiée
- **Base de données**: MongoDB
- **Proxy**: FastAPI route `/api/v2/*` vers NestJS

### Décisions d'Architecture
1. **Coexistence temporaire**: FastAPI (legacy) + NestJS (cible)
2. **Migration progressive**: Nouvelles features sur NestJS uniquement
3. **UUID comme identifiant hotel**: Compatible avec FastAPI et NestJS

## Module Housekeeping - MVP Réception ✅

### Backend NestJS (TERMINÉ)
```
/app/backend-nest/
├── src/
│   ├── modules/
│   │   ├── housekeeping/  # Gestion tâches, inspections, WebSocket
│   │   ├── rooms/         # CRUD chambres, stats
│   │   └── staff/         # Personnel housekeeping
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

### Frontend React (TERMINÉ)
- `ReceptionViewV2.jsx` - Tableau interactif des chambres
- `useHousekeepingV2.js` - Hook avec WebSocket

## Données de Démo
- **40 chambres** sur 4 étages
- **9 membres staff** (4 femmes de chambre, 1 gouvernante, 2 maintenance, 2 petit-déj)
- **21 tâches** quotidiennes (8 départs, 13 recouches)

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

### P2 - Phases futures
- [ ] Phase 2: Marketing, Guest Experience, Channel Manager
- [ ] Phase 3: Conciergerie IA, automatisations avancées

## Credentials Test
- Admin: `admin@flowtym.com` / `admin123`
- Super Admin: `superadmin@flowtym.com` / `super123`
- Hotel ID (UUID): `4f02769a-5f63-4121-bb97-a7061563d934`

## Changelog

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
