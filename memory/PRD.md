# FLOWTYM V4 - Product Requirements Document

## Vision Produit
**FLOWTYM** = Le système d'exploitation des hôtels modernes
- Plus simple que Cloudbeds
- Plus moderne que Mews
- Plus puissant et intuitif qu'Opera

**Cible:** Hôtels indépendants, petits groupes, boutique hotels, hôtels premium

---

## Architecture 8 Menus Métiers

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  FLOWBOARD │ OPERATIONS │ REVENUE │ DISTRIBUTION │ GUEST │ MARKETING │ FINANCE │ PLATFORM │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 1. FLOWBOARD
- Dashboard stratégique central
- KPIs temps réel (TO, ADR, RevPAR, CA)
- Arrivées/Départs du jour
- Alertes critiques

### 2. OPERATIONS (Cœur Opérationnel)
- **PMS & Planning** - Réservations & Planning visuel
- **Check-in/out** - Arrivées & Départs (OCR Phase 2)
- **Housekeeping** - Ménage & Chambres
- **Maintenance** - Tickets & Interventions
- **Staff** - Personnel & Planning (Complet)
- **Consignes** - Cahier de consignes intelligent
- **Groups & MICE** - Groupes & Séminaires (Phase 2)

### 3. REVENUE (Pilotage Tarifaire)
- **RMS & Pricing** - Yield Management
- **Simulation & Devis** - Multi-chambres, Multi-périodes, Conversion (DIFFÉRENCIATEUR)
- **Rapports** - Analytics & KPIs

### 4. DISTRIBUTION (Vente)
- **Booking Engine** - Réservation directe
- **Channel Manager** - OTA & Partenaires (Phase 2)

### 5. GUEST EXPERIENCE
- **CRM & Clients** - Base clients
- **E-Réputation** - Avis & Satisfaction
- **Conciergerie** - Services premium (Phase 2)

### 6. MARKETING
- **Campagnes** - Email & SMS (Phase 2)
- **Fidélité** - Programme points (Phase 3)

### 7. FINANCE
- **Facturation** - Factures & Paiements
- **Comptabilité** - P&L & Exports (Phase 2)

### 8. PLATFORM
- **Configuration** - Paramètres hôtel
- **Data Hub** - Données & Exports
- **Intégrations** - API & Partenaires
- **Utilisateurs** - Accès & Permissions (Phase 2)

---

## Implémentation Complétée

### ✅ Session du 30 Mars 2026

#### Navigation Restructurée
- [x] 8 menus métiers avec mega menu dropdowns
- [x] Sous-menus avec icônes et descriptions
- [x] Badges "Nouveau" et "Bientôt"
- [x] Redirection par défaut vers Flowboard

#### Nouveaux Modules
- [x] **Simulation & Devis** (`/simulation`)
  - 5 KPIs (Total, Brouillons, Envoyés, Convertis, Taux conversion)
  - Workflow visuel (Simulation → Devis PDF → Réservation)
  - Tableau multi-chambres et multi-périodes
  - Actions rapides (Envoyer, Convertir, Télécharger)

- [x] **Finance** (`/finance`)
  - 4 KPIs (CA Total, Encaissé, En attente, En retard)
  - 3 onglets (Factures, Paiements, Comptabilité)
  - Tableau factures avec statuts

- [x] **Maintenance** (`/maintenance`)
  - 5 KPIs (Total, Ouverts, En cours, Résolus, Urgents)
  - Tableau tickets avec priorités et assignations

#### Modules Existants Préservés
- [x] Flowboard (Dashboard stratégique)
- [x] PMS & Planning
- [x] Housekeeping (Complet - style Rorck)
- [x] Staff (Complet - non simplifié)
- [x] Consignes (Cahier intelligent avec IA)
- [x] CRM
- [x] E-Réputation
- [x] Booking Engine
- [x] RMS
- [x] Data Hub
- [x] Configuration
- [x] Intégrations

### Sessions Précédentes
- [x] Flowtym AI Support Center (Auto-diagnostic IA)
- [x] Notifications Push temps réel
- [x] Interface Support Agent dédiée
- [x] Système d'accès à distance
- [x] Login Page design propre

---

## Roadmap Par Phase

### 🔴 MVP (Actuel)
| Module | Statut | Notes |
|--------|--------|-------|
| Flowboard | ✅ | KPIs + Dashboard |
| PMS Planning | ✅ | Planning visuel |
| Check-in/out | ✅ | Manuel (sans OCR) |
| Housekeeping | ✅ | Complet style Rorck |
| Maintenance | ✅ | Tickets basiques |
| Staff | ✅ | Complet |
| Consignes | ✅ | IA intégrée |
| Simulation & Devis | ✅ | UI créée (données mock) |
| Finance | ✅ | UI créée (données mock) |
| Booking Engine | ✅ | Widget réservation |

### 🟡 Phase 2
| Module | Priorité | Description |
|--------|----------|-------------|
| Planning KPIs | P0 | TO/ADR/RevPAR intégrés entre Événements et Chambres |
| Check-in OCR | P1 | Scan ID avec auto-remplissage |
| Channel Manager | P1 | Sync Booking, Expedia, Airbnb |
| Groups & MICE | P1 | Allotements, Rooming list |
| Conciergerie | P2 | Taxi APIs, TheFork |
| Comptabilité | P2 | P&L, Exports |

### 🟢 Phase 3
| Module | Description |
|--------|-------------|
| Procurement | Fournisseurs, Stock, Commandes |
| Compliance | Contrôles réglementaires |
| Marketing Automation | Workflows automatisés |
| Fidélité | Programme points |
| Multi-hôtels | Vue consolidée groupe |

---

## Data Models (MongoDB)

### Collections Principales
```javascript
// Voir /app/memory/FLOWTYM_V4_ARCHITECTURE.md pour le schéma complet
- hotels
- reservations
- rooms
- clients
- consignes (implémenté)
- housekeeping_tasks
- maintenance_tickets
- invoices
- staff
```

---

## Design System

### Couleurs
- Primary: #7C8CF8 (Violet doux)
- Background: #F8F9FB
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

### Principes UX
- Actions en 1 clic maximum
- Animations fluides (200-300ms)
- Interface épurée et moderne
- Mobile-first pour modules terrain

---

## Credentials de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@flowtym.com | admin123 |
| Super Admin | superadmin@flowtym.com | super123 |
| Support | support@flowtym.com | Flowtym@Support2026! |

---

## Fichiers Clés

### Frontend
- `/app/frontend/src/components/layout/TopNavigation.jsx` - Navigation 8 menus
- `/app/frontend/src/pages/simulation/SimulationModule.jsx` - Module Devis
- `/app/frontend/src/pages/finance/FinanceModule.jsx` - Module Finance
- `/app/frontend/src/pages/maintenance/MaintenanceModule.jsx` - Module Maintenance
- `/app/frontend/src/pages/consignes/ConsignesModule.jsx` - Module Consignes

### Backend
- `/app/backend/consignes/routes.py` - API Consignes
- `/app/backend/housekeeping/routes.py` - API Housekeeping

### Documentation
- `/app/memory/FLOWTYM_V4_ARCHITECTURE.md` - Architecture détaillée

---

## Prochaines Tâches Prioritaires

1. **P0** - Implémenter les KPIs (TO, ADR, RevPAR) dans le Planning entre "Événements" et "Chambres libres"
2. **P0** - Connecter le backend pour Simulation & Devis (CRUD, génération PDF)
3. **P0** - Connecter le backend pour Finance (facturation réelle)
4. **P1** - Connecter le backend pour Maintenance (tickets)
5. **P2** - Intégrer le Channel Manager (Phase 2)

---

*Dernière mise à jour: 30 Mars 2026*
