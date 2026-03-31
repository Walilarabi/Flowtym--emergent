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

### P0 - Court terme
- [ ] Tests frontend ReceptionViewV2 complets
- [ ] Connecter useHousekeepingV2 au HotelContext existant

### P1 - Vue Mobile Femme de Chambre
- [ ] Interface swipe cards
- [ ] Scanner QR code
- [ ] Timer de nettoyage
- [ ] Upload photos

### P1 - Vue Gouvernante
- [ ] Validation inspections
- [ ] Gestion équipe
- [ ] Stocks

### P2 - Dashboard Direction
- [ ] KPIs temps réel
- [ ] Graphiques performance
- [ ] Historique

## Credentials Test
- Admin: `admin@flowtym.com` / `admin123`
- Super Admin: `superadmin@flowtym.com` / `super123`
- Hotel ID (UUID): `4f02769a-5f63-4121-bb97-a7061563d934`

## Changelog

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
