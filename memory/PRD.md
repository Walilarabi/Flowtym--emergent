# FLOWTYM PMS - Product Requirements Document

## Vision
FLOWTYM est un PMS (Property Management System) SaaS hôtelier moderne, structuré en 8 piliers modulaires, avec une priorité sur le module Housekeeping.

## Architecture Technique

### Stack Actuelle
- **Backend (FastAPI)**: Port 8001 - API principale
- **Frontend (React/Vite)**: Port 3000 - Interface unifiée
- **Base de données**: Supabase PostgreSQL (migration depuis MongoDB complète)
- **Auth**: Supabase Auth (JWT natif, sessions gérées côté client)
- **Realtime**: Supabase Realtime
- **Paiements**: Stripe Connect + emergentintegrations

### Supabase
- URL: `https://mqdftrilwqdsnvryejsb.supabase.co`
- 50+ tables PostgreSQL avec FK, enums, et RLS
- Enums: `user_role`, `room_status`, `reservation_status`, `cleaning_status`, etc.

## Modules Implémentés

### Stripe Connect (NEW - 2026-04-13)
- **Backend**: `/app/backend/routes/stripe_connect.py` - 10 endpoints
- **Frontend**: `/app/frontend/src/components/stripe/` - 5 composants
- **Page**: `/app/frontend/src/pages/finance/StripeConnectPage.jsx`
- **SQL**: `/app/flowtym-stripe-connect.sql` (à exécuter dans Supabase)
- Endpoints:
  - `POST /api/stripe/create-connect-account` - Créer compte connecté
  - `POST /api/stripe/create-account-link` - Lien d'onboarding
  - `GET /api/stripe/account-status/{id}` - Statut du compte
  - `POST /api/stripe/create-product` - Créer produit
  - `GET /api/stripe/products/{id}` - Liste produits
  - `POST /api/stripe/create-checkout-session` - Session checkout
  - `POST /api/stripe/quick-checkout` - Paiement rapide (emergentintegrations)
  - `GET /api/stripe/checkout-status/{id}` - Statut checkout
  - `GET /api/stripe/hotel/{id}` - Info Stripe de l'hôtel
  - `POST /api/stripe/webhook` - Webhooks

### Module Finance
- Facturation (factures, statuts, filtres)
- Paiements (Stripe, PayPal, Adyen — PaymentIntent, Checkout, Webhooks, Remboursements)
- **Stripe Connect** (NEW) — onglet dédié dans Finance
- Comptabilité (à venir)

### Module Housekeeping V2 (COMPLET)
- ReceptionViewV2, DirectionViewV2, GouvernanteViewV2, MobileHousekeepingViewV2
- 40 chambres, 9 staff, 21 tâches quotidiennes
- Signalements, Objets Trouvés, Configuration catégories

### Autres Modules
- Flowboard (Dashboard central avec KPIs Supabase)
- PMS Standalone (iframe avec Bridge Supabase)
- CRM (service créé, UI à connecter)
- Channel Manager, Booking Engine, RMS, Staff, Configuration

## Données de Démo
- **40 chambres** sur 4 étages
- **9 membres staff**
- **21 tâches** quotidiennes
- **11 chambres Supabase** avec réservations

## Credentials Test
- Admin: `admin@flowtym.com` / `admin123` (Supabase Auth)
- Réception: `reception@hotel.com` / `reception123`
- Gouvernante: `gouvernante@hotel.com` / `gouv123`
- Femme de chambre: `femme1@hotel.com` / `femme123`
- Maintenance: `maintenance@hotel.com` / `maint123`
- Hotel ID: `fae266ac-2f4c-4297-af9f-b3b988d86c5b`
- Bouton "Accès démo" sur la page de login

## Priorités Restantes

### P1 - En attente
- [ ] CRM UI : Connecter l'interface CRM React au service Supabase
- [ ] Housekeeping Phase 5 — Maintenance
- [ ] Configuration Email (SendGrid/Resend)
- [ ] Exécuter `/app/flowtym-stripe-connect.sql` dans Supabase SQL Editor

### P2 - Phases futures
- [ ] Nettoyage MongoDB/NestJS
- [ ] Rapports et Exports PDF
- [ ] WebSockets temps réel (actuellement HTTP polling)

## Changelog

### 2026-04-13 - Intégration Stripe Connect (COMPLETE)
- **Backend**: 10 endpoints Stripe Connect dans `/app/backend/routes/stripe_connect.py`
  - Comptes connectés (création, onboarding, statut)
  - Produits (création, liste sur comptes connectés)
  - Checkout sessions (Connect + Quick via emergentintegrations)
  - Webhooks, status polling, info hôtel
- **Frontend**: 5 composants React dans `/app/frontend/src/components/stripe/`
  - ConnectOnboarding, AccountStatus, StripeProducts, QuickPayment, CheckoutReturn
  - Page dédiée StripeConnectPage avec 3 onglets (Compte, Produits, Paiement rapide)
  - Intégré au FinanceModule comme onglet "Stripe Connect"
- **SQL**: Script `/app/flowtym-stripe-connect.sql` (stripe_accounts, stripe_products, RLS)
- **Design**: Style pastel/glassmorphism, boutons arrondis (40px), conforme à la charte Flowtym
- **Tests**: 100% backend (17/17), 100% frontend — iteration_52
- **Notes**: Connect operations nécessitent une vraie clé Stripe. Quick-checkout fonctionne avec sk_test_emergent via emergentintegrations.
