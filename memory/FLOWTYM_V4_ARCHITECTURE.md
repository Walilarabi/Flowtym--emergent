# 🏨 FLOWTYM V4 - ARCHITECTURE PRODUIT RESTRUCTURÉE

## 📋 RÉSUMÉ EXÉCUTIF

**Vision:** FLOWTYM = Le système d'exploitation des hôtels modernes
**Positionnement:** Plus simple que Cloudbeds, plus moderne que Mews, plus puissant qu'Opera
**Cible:** Hôtels indépendants, petits groupes, boutique hotels

---

## 🧭 STRUCTURE MENU PRINCIPALE (8 PILIERS)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FLOWBOARD │ OPERATIONS │ REVENUE │ DISTRIBUTION │ GUEST │ MARKETING │ FINANCE │ PLATFORM │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🚀 PRIORISATION PAR PHASE

## 🔴 PHASE MVP (4-6 semaines) - CORE BUSINESS

> **Objectif:** Minimum viable pour vendre et opérer un hôtel

### 1. FLOWBOARD MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  📊 FLOWBOARD - Dashboard Stratégique                            │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── 4 KPI Cards (TO%, CA Jour, ADR, RevPAR)                    │
│  ├── Arrivées du jour (liste)                                    │
│  ├── Départs du jour (liste)                                     │
│  ├── Alertes critiques (surbooking, maintenance urgente)         │
│  └── Chambres disponibles                                        │
│                                                                  │
│  ❌ Phase 2: Graphiques évolution, N/N-1, prévisions            │
└──────────────────────────────────────────────────────────────────┘
```

### 2. OPERATIONS MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️ OPERATIONS - Cœur Opérationnel                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2.1 PMS & PLANNING (MVP CRITIQUE)                               │
│  ├── Planning visuel (lignes=chambres, colonnes=dates)          │
│  ├── Vue 7j/14j/30j (SANS scroll horizontal)                    │
│  ├── Drag & Drop réservations                                    │
│  ├── Création rapide (clic cellule → drawer)                    │
│  ├── KPI intégrés entre "Événement" et "Chambres libres":       │
│  │   └── TO | ADR | RevPAR (cliquables)                         │
│  └── Modification réservation (drawer)                           │
│                                                                  │
│  2.2 RÉSERVATIONS (MVP)                                          │
│  ├── Liste filtrable (dates, statut, canal)                     │
│  ├── Recherche instantanée                                       │
│  ├── Actions: Modifier, Annuler                                  │
│  └── Simulation → Réservation (conversion)                       │
│                                                                  │
│  2.3 CHECK-IN/OUT (MVP SIMPLIFIÉ)                                │
│  ├── Check-in manuel (formulaire rapide)                        │
│  ├── Attribution chambre                                         │
│  ├── Signature digitale                                          │
│  └── Check-out + facture auto                                    │
│  ❌ MVP: Scan ID OCR (Phase 2)                                   │
│                                                                  │
│  2.4 HOUSEKEEPING (MVP)                                          │
│  ├── Statuts: Sale / Propre / En cours                          │
│  ├── Assignation simple                                          │
│  └── Vue liste (pas mobile MVP)                                  │
│  ❌ MVP: Vue mobile, checklist, productivité (Phase 2)           │
│                                                                  │
│  2.5 MAINTENANCE (MVP LIGHT)                                     │
│  ├── Création ticket simple                                      │
│  ├── Statuts: Ouvert / Résolu                                   │
│  └── Assignation                                                 │
│  ❌ MVP: Priorités, historique équipement (Phase 2)              │
│                                                                  │
│  2.6 STAFF (MVP LIGHT)                                           │
│  ├── Liste employés                                              │
│  ├── Rôles basiques (Admin, Réception, Housekeeping)            │
│  └── Assignation dans tâches                                     │
│  ❌ MVP: Planning shifts, pointage, performance (Phase 2)        │
│                                                                  │
│  2.7 CONSIGNES (MVP) ✅ DÉJÀ FAIT                                │
│  ├── Dashboard                                                   │
│  ├── Liste + filtres                                             │
│  ├── Calendrier                                                  │
│  └── Création avec assignation                                   │
│                                                                  │
│  ❌ MVP: Groups, Procurement, Compliance (Phase 2/3)             │
└──────────────────────────────────────────────────────────────────┘
```

### 3. REVENUE MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  💰 REVENUE - Pilotage Tarifaire                                │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── Dashboard Revenue (TO, ADR, RevPAR, CA)                    │
│  ├── Grille tarifaire simple (par type chambre)                 │
│  └── Modification tarifs manuelle                                │
│                                                                  │
│  ❌ Phase 2: RMS IA, Yield automatique, Forecasting             │
└──────────────────────────────────────────────────────────────────┘
```

### 4. DISTRIBUTION MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  🌐 DISTRIBUTION - Vente des Chambres                           │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── Disponibilités (vue synthétique)                           │
│  ├── Booking Engine (widget réservation directe)                │
│  └── Fermetures manuelles                                        │
│                                                                  │
│  ❌ Phase 2: Channel Manager, OTA sync, Parité                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5. GUEST EXPERIENCE MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  👤 GUEST EXPERIENCE - Expérience Client                        │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── QR Code chambre → Page accueil client                      │
│  ├── Infos hôtel (wifi, horaires, adresse)                      │
│  └── Room Service basique (menu + commande)                      │
│                                                                  │
│  ❌ Phase 2: Conciergerie (Taxi, TheFork)                       │
│  ❌ Phase 3: Upsell IA, Fidélité, IoT                           │
└──────────────────────────────────────────────────────────────────┘
```

### 6. MARKETING MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  📣 MARKETING - Acquisition & Fidélisation                      │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── E-réputation (monitoring Google/Booking)                   │
│  └── Emails transactionnels (confirmation, rappel)              │
│                                                                  │
│  ❌ Phase 2: Campagnes email, Segmentation                      │
│  ❌ Phase 3: A/B testing, SMS, Automation                       │
└──────────────────────────────────────────────────────────────────┘
```

### 7. FINANCE MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  💳 FINANCE - Trésorerie & Comptabilité                         │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── Facturation auto (TVA, extras)                             │
│  ├── Paiement intégré (Stripe)                                  │
│  ├── Liste factures                                              │
│  └── Export CSV                                                  │
│                                                                  │
│  ❌ Phase 2: P&L, Comptabilité avancée, Rapprochement           │
│  ❌ Phase 3: ERP intégration (Sage, QuickBooks)                 │
└──────────────────────────────────────────────────────────────────┘
```

### 8. PLATFORM MVP
```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 PLATFORM - Cerveau Technique                                │
├──────────────────────────────────────────────────────────────────┤
│  MVP:                                                            │
│  ├── Configuration hôtel (nom, timezone, chambres)              │
│  ├── Utilisateurs & Rôles (3 niveaux)                           │
│  └── Paramètres de base                                          │
│                                                                  │
│  ❌ Phase 2: Multi-hôtels, API, Webhooks                        │
│  ❌ Phase 3: Marketplace, Data Hub avancé                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🟡 PHASE 2 (8-12 semaines) - DIFFÉRENCIATION

### OPERATIONS Phase 2
- **Check-in OCR:** Scan ID avec auto-remplissage
- **Housekeeping Mobile:** App terrain optimisée
- **Housekeeping Checklist:** Tâches par chambre
- **Maintenance Avancée:** Priorités, historique équipement
- **Staff Complet:** Planning shifts, pointage, performance
- **Groups & MICE:** Allotements, rooming list, facturation groupée
- **Procurement Basic:** Fournisseurs, commandes, stock simple

### REVENUE Phase 2
- **RMS Recommandations IA:** Suggestions de prix automatiques
- **Analyse Concurrence:** Monitoring tarifs competitors
- **Forecasting:** Prévision occupation 30/60/90j

### DISTRIBUTION Phase 2
- **Channel Manager:** Sync Booking, Expedia, Airbnb
- **Parité Tarifaire:** Alertes et correction auto
- **Overbooking Management:** Gestion automatisée

### GUEST EXPERIENCE Phase 2
- **Conciergerie:** Intégration Taxi APIs + TheFork
- **Feedback Temps Réel:** Collecte avis pendant séjour
- **Notifications:** SMS/WhatsApp client

### MARKETING Phase 2
- **Campagnes Email:** Templates + envoi massif
- **Segmentation Client:** Profils automatiques
- **Avis Management:** Réponses centralisées

### FINANCE Phase 2
- **P&L:** Compte de résultat par période
- **Cash Management:** Suivi trésorerie
- **Exports Comptables:** EBP, Sage

### PLATFORM Phase 2
- **Multi-Hôtels:** Vue consolidée groupe
- **API & Webhooks:** Documentation Swagger
- **Audit Logs:** Traçabilité complète

---

## 🟢 PHASE 3 (16+ semaines) - EXCELLENCE

### OPERATIONS Phase 3
- **Compliance & Contrôles:** Gestion réglementaire complète
- **Procurement Avancé:** IA optimisation, paiement fournisseurs
- **Staff Performance:** Analytics, KPIs employés

### REVENUE Phase 3
- **Yield Automatique:** Pricing dynamique IA
- **What-If Scenarios:** Simulations avancées

### GUEST EXPERIENCE Phase 3
- **Upsell IA:** Propositions personnalisées temps réel
- **Fidélité:** Programme points, statuts, récompenses
- **IoT:** Contrôle chambre (température, lumière)

### MARKETING Phase 3
- **Marketing Automation:** Workflows automatisés
- **SMS Marketing:** Campagnes SMS
- **A/B Testing:** Optimisation emails

### FINANCE Phase 3
- **ERP Integration:** Sage, QuickBooks, Cegid
- **Analytics Finance:** EBITDA, coûts opérationnels

### PLATFORM Phase 3
- **Marketplace:** Modules complémentaires
- **Data Hub:** Data warehouse, exports avancés
- **Mode Hors Ligne:** Cache local + sync

---

# 📐 SPÉCIFICATIONS TECHNIQUES

## 🗄️ DATA MODEL (MongoDB Multi-Tenant)

### Collections Core (MVP)
```javascript
// hotels
{
  _id: ObjectId,
  name: String,
  timezone: String,           // "Europe/Paris"
  currency: String,           // "EUR"
  address: { street, city, postal_code, country },
  settings: {
    checkin_time: "15:00",
    checkout_time: "11:00",
    features: []              // modules activés
  },
  created_at: Date
}

// rooms
{
  _id: ObjectId,
  hotel_id: ObjectId,
  number: String,             // "101"
  type: String,               // "standard", "deluxe", "suite"
  floor: Number,
  max_occupancy: Number,
  base_price: Number,
  status: String,             // "available", "occupied", "cleaning", "maintenance"
  amenities: [],
  created_at: Date
}

// reservations
{
  _id: ObjectId,
  hotel_id: ObjectId,
  client_id: ObjectId,
  room_id: ObjectId,
  status: String,             // "provisional", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"
  check_in: Date,
  check_out: Date,
  adults: Number,
  children: Number,
  channel: String,            // "direct", "booking", "expedia"
  price: {
    room_rate: Number,
    total_ht: Number,
    total_ttc: Number,
    extras: []
  },
  special_requests: String,
  created_at: Date,
  updated_at: Date
}

// clients
{
  _id: ObjectId,
  hotel_id: ObjectId,
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  nationality: String,
  id_type: String,            // "passport", "id_card"
  id_number: String,
  address: Object,
  preferences: {},
  tags: [],                   // "VIP", "business", "family"
  total_stays: Number,
  total_revenue: Number,
  created_at: Date
}

// consignes (DÉJÀ IMPLÉMENTÉ)
{
  _id: ObjectId,
  consigne_id: String,
  hotel_id: String,
  title: String,
  description: String,
  room_number: String,
  client_name: String,
  service: String,            // "reception", "housekeeping", "maintenance"...
  assigned_to: String,
  priority: String,           // "basse", "normale", "haute", "urgente"
  status: String,             // "nouvelle", "a_faire", "en_cours", "fait", "fermee"
  due_date: String,
  recurrence: String,
  requires_proof: Boolean,
  attachments: [],
  history: [],
  created_at: Date
}

// staff
{
  _id: ObjectId,
  hotel_id: ObjectId,
  user_id: ObjectId,          // lien vers users
  first_name: String,
  last_name: String,
  role: String,               // "admin", "reception", "housekeeping", "maintenance"
  department: String,
  is_active: Boolean,
  created_at: Date
}

// housekeeping_tasks
{
  _id: ObjectId,
  hotel_id: ObjectId,
  room_id: ObjectId,
  room_number: String,
  status: String,             // "sale", "en_cours", "propre", "controle"
  task_type: String,          // "depart", "recouche", "inspection"
  assigned_to: ObjectId,
  priority: String,
  started_at: Date,
  completed_at: Date,
  created_at: Date
}

// maintenance_tickets
{
  _id: ObjectId,
  hotel_id: ObjectId,
  room_id: ObjectId,
  title: String,
  description: String,
  priority: String,           // "urgent", "normal", "low"
  status: String,             // "open", "in_progress", "resolved", "closed"
  assigned_to: ObjectId,
  reported_by: ObjectId,
  created_at: Date,
  resolved_at: Date
}

// invoices
{
  _id: ObjectId,
  hotel_id: ObjectId,
  reservation_id: ObjectId,
  client_id: ObjectId,
  invoice_number: String,
  lines: [{
    description: String,
    quantity: Number,
    unit_price: Number,
    vat_rate: Number,
    total: Number
  }],
  subtotal: Number,
  vat_total: Number,
  total: Number,
  status: String,             // "draft", "sent", "paid", "cancelled"
  created_at: Date
}
```

### Collections Phase 2
```javascript
// guest_sessions (QR tokens)
{
  _id: ObjectId,
  hotel_id: ObjectId,
  room_id: ObjectId,
  reservation_id: ObjectId,
  token: String,              // JWT encodé
  valid_from: Date,
  valid_until: Date,
  last_activity: Date
}

// concierge_requests
{
  _id: ObjectId,
  hotel_id: ObjectId,
  room_id: ObjectId,
  reservation_id: ObjectId,
  type: String,               // "taxi", "restaurant", "room_service", "other"
  details: {
    destination: String,
    time: Date,
    notes: String
  },
  status: String,             // "pending", "confirmed", "completed", "cancelled"
  external_reference: String,
  commission_amount: Number,
  created_at: Date
}

// groups
{
  _id: ObjectId,
  hotel_id: ObjectId,
  name: String,
  organizer: String,
  check_in: Date,
  check_out: Date,
  rooms_count: Number,
  reservations: [ObjectId],
  billing_type: String,       // "individual", "master"
  total_amount: Number,
  status: String,
  created_at: Date
}
```

### Collections Phase 3
```javascript
// suppliers
{
  _id: ObjectId,
  hotel_id: ObjectId,
  name: String,
  type: String,               // "service", "product"
  category: String,
  contact: {},
  contract_url: String,
  classification: String,
  created_at: Date
}

// purchase_orders
{
  _id: ObjectId,
  hotel_id: ObjectId,
  supplier_id: ObjectId,
  items: [],
  total_ht: Number,
  status: String,             // "pending", "confirmed", "delivered", "invoiced"
  created_at: Date
}

// compliance_controls
{
  _id: ObjectId,
  hotel_id: ObjectId,
  type: String,               // "ascenseur", "electricite", "ssi", "classement"
  equipment: String,
  organization: String,
  frequency: String,
  last_date: Date,
  next_date: Date,
  status: String,             // "ok", "warning", "expired"
  documents: [],
  created_at: Date
}
```

### Index MongoDB Essentiels
```javascript
// Performance critique
db.reservations.createIndex({ hotel_id: 1, check_in: 1, check_out: 1 })
db.reservations.createIndex({ hotel_id: 1, status: 1 })
db.rooms.createIndex({ hotel_id: 1, status: 1 })
db.clients.createIndex({ hotel_id: 1, email: 1 })
db.consignes.createIndex({ hotel_id: 1, status: 1, due_date: 1 })
db.housekeeping_tasks.createIndex({ hotel_id: 1, status: 1 })
db.invoices.createIndex({ hotel_id: 1, status: 1 })

// Phase 2
db.guest_sessions.createIndex({ token: 1 }, { unique: true })
db.guest_sessions.createIndex({ valid_until: 1 }, { expireAfterSeconds: 0 })
db.concierge_requests.createIndex({ hotel_id: 1, status: 1 })
```

---

## 🎨 DESIGN SYSTEM

### Palette Couleurs
```css
:root {
  /* Primary */
  --primary: #7C8CF8;           /* Violet doux - Actions principales */
  --primary-hover: #6B7BF7;
  --primary-light: #E8EBFE;

  /* Background */
  --bg-app: #F8F9FB;            /* Fond application */
  --bg-card: #FFFFFF;
  --bg-hover: #F3F4F6;

  /* Text */
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;

  /* Status */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;

  /* Borders */
  --border-light: #E5E7EB;
  --border-default: #D1D5DB;
}
```

### Animations
```css
/* Transitions fluides 200-300ms */
.transition-fast { transition: all 150ms ease; }
.transition-normal { transition: all 200ms ease; }
.transition-slow { transition: all 300ms ease; }

/* Micro-interactions */
.hover-lift:hover { transform: translateY(-2px); }
.hover-scale:hover { transform: scale(1.02); }
```

### Composants Clés
- **Cards:** border-radius: 12px, shadow légère
- **Buttons:** border-radius: 8px, padding confortable
- **Inputs:** border-radius: 8px, focus violet
- **Tables:** alternance couleurs, hover row
- **Modals:** backdrop blur, animation slide-up

---

## 🔥 FONCTIONNALITÉ DIFFÉRENCIANTE: SIMULATION & DEVIS

### Workflow Complet
```
1. CRÉATION SIMULATION
   ├── Sélection dates (multi-périodes possible)
   ├── Sélection chambres (multi-chambres)
   ├── Choix tarif/options
   └── Calcul automatique prix

2. GÉNÉRATION DEVIS
   ├── PDF professionnel
   ├── Envoi email client
   └── Lien de paiement

3. CONVERSION
   ├── Client accepte → Réservation créée
   ├── Paiement en ligne
   └── Confirmation automatique
```

### UX Ultra Simple
- **1 clic:** Créer simulation depuis planning
- **2 clics:** Générer devis PDF
- **3 clics:** Convertir en réservation confirmée

---

## 📊 PLANNING - MODULE CLÉ

### Spécifications UX
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏨 Hotel Demo                        [ 7j ] [ 14j ] [ 30j ]    📅 Mars 2026 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ÉVÉNEMENTS                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 🎉 Salon du Tourisme (15-17 mars)  │  🎭 Concert Jazz (22 mars)        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────┬─────────┬─────────┬─────────┐                                  │
│  │   TO    │   ADR   │ RevPAR  │ Libres  │  ← KPI CLIQUABLES               │
│  │  78%    │  €125   │  €97    │   12    │                                  │
│  └─────────┴─────────┴─────────┴─────────┘                                  │
│                                                                              │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐                  │
│  │ CH.  │ Lun  │ Mar  │ Mer  │ Jeu  │ Ven  │ Sam  │ Dim  │                  │
│  │      │ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │                  │
│  ├──────┼──────┴──────┴──────┼──────┴──────┴──────┼──────┤                  │
│  │ 101  │ ████ Dupont ████████│ ████ Martin ██████│      │  ← Drag&Drop    │
│  ├──────┼─────────────────────┼───────────────────┼──────┤                  │
│  │ 102  │      │██ Bernard ███████████████████████████│  │                  │
│  ├──────┼──────┼──────┬──────┼──────┬──────┬──────┼──────┤                  │
│  │ 103  │      │      │      │      │      │      │      │  ← Clic = New   │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘                  │
│                                                                              │
│  ❌ PAS DE SCROLL HORIZONTAL - Tout visible                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Règles Critiques
1. **Pas de scroll horizontal** - Vue adaptative selon période choisie
2. **KPI entre Événements et Chambres** - Cliquables pour détails
3. **Drag & Drop** - Déplacer réservations entre chambres/dates
4. **Ultra rapide** - < 200ms pour chaque action

---

## 🔌 INTÉGRATIONS (Planifiées mais non MVP)

### Phase 2
| Service | Usage | API |
|---------|-------|-----|
| Stripe | Paiements | REST |
| Booking.com | Channel | XML/JSON |
| Expedia | Channel | XML |
| Airbnb | Channel | REST |

### Phase 3
| Service | Usage | API |
|---------|-------|-----|
| Taxi Connect | Conciergerie | REST |
| TheFork | Conciergerie | REST |
| Bureau Veritas | Compliance | API/Email |
| Sage | Comptabilité | REST |

---

## ✅ CHECKLIST MVP

### Backend (Priorité 1)
- [ ] Restructurer server.py avec nouveaux menus
- [ ] Simplifier routes PMS (planning, réservations)
- [ ] Optimiser planning (sans scroll horizontal)
- [ ] Simulation & Devis module
- [ ] Housekeeping simplifié
- [ ] Maintenance simplifié
- [ ] Facturation basique
- [ ] Configuration hôtel

### Frontend (Priorité 1)
- [ ] Nouvelle navigation 8 menus
- [ ] Flowboard Dashboard KPIs
- [ ] Planning visuel (7j/14j/30j)
- [ ] Drawer création réservation
- [ ] Drag & Drop réservations
- [ ] Check-in/out simplifié
- [ ] Housekeeping liste
- [ ] Maintenance tickets
- [ ] Facturation + PDF

### Design (Priorité 1)
- [ ] Palette couleurs (#7C8CF8, #F8F9FB)
- [ ] Animations fluides (200-300ms)
- [ ] Actions 1 clic
- [ ] Mobile responsive

---

## 📈 ROADMAP RÉSUMÉE

| Phase | Durée | Focus | Valeur Business |
|-------|-------|-------|-----------------|
| **MVP** | 4-6 sem | Core PMS + Check-in/out + Facturation | Vente immédiate |
| **Phase 2** | 8-12 sem | Channel Manager + Conciergerie + Groups | Différenciation |
| **Phase 3** | 16+ sem | IA + Compliance + Procurement | Excellence |

---

*Document généré le 30 Mars 2026*
*Version: 4.0-ARCHITECTURE*
