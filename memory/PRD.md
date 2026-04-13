# FLOWTYM PMS - Product Requirements Document

## Vision
FLOWTYM est un PMS (Property Management System) SaaS hôtelier moderne, structuré en 8 piliers modulaires.

## Architecture Technique
- **Backend (FastAPI)**: Port 8001
- **Frontend (React/Vite)**: Port 3000
- **Base de données**: Supabase PostgreSQL (50+ tables, RLS, Realtime)
- **Auth**: Supabase Auth
- **Paiements**: Stripe Connect + emergentintegrations + Automation

## Modules Implémentés

### Stripe Connect (2026-04-13)
- 10 endpoints dans `/app/backend/routes/stripe_connect.py`
- UI dans `/finance/stripe` (3 onglets: Compte, Produits, Paiement rapide)
- SQL: `/app/flowtym-stripe-connect.sql` (EXECUTÉ)

### Payment Automation (2026-04-13)
- 7 endpoints dans `/app/backend/routes/payment_automation.py`
- PaymentBlock component dans ReservationDetail (onglet "Paiement")
- Cron job pour envoi automatique liens + annulation auto
- 7 statuts: pending, link_sent, preauthorized, partial_paid, paid, failed, cancelled
- Endpoints:
  - GET /api/payments/auto/status/{id} — Statut paiement complet
  - POST /api/payments/auto/send-link — Envoi lien manuel (total/acompte/1ère nuit/custom)
  - POST /api/payments/auto/preauthorize — Préautorisation carte
  - POST /api/payments/auto/capture-preauth — Capturer préauth
  - POST /api/payments/auto/cancel-preauth — Annuler préauth
  - POST /api/payments/auto/send-reminder — Relance
  - POST /api/payments/auto/process-cron — Cron automatique

### Finance Module
- Factures, Paiements, Stripe Connect, Comptabilité (à venir)

### Housekeeping V2 (COMPLET)
- Réception, Direction, Gouvernante, Mobile

### Autres
- Flowboard, PMS Standalone, CRM, Channel Manager, Booking Engine, RMS, Staff

## Credentials
- Admin: admin@flowtym.com / admin123
- Hotel ID: fae266ac-2f4c-4297-af9f-b3b988d86c5b
- Bouton "Accès démo" sur login

## Priorités Restantes
### P1
- [ ] Configurer vraies clés Stripe dans backend/.env
- [ ] CRM UI vers Supabase
- [ ] Housekeeping Phase 5 — Maintenance
- [ ] Configuration Email (SendGrid/Resend) pour liens de paiement

### P2
- [ ] Nettoyage MongoDB/NestJS
- [ ] Rapports et Exports PDF

## Changelog

### 2026-04-13 — Payment Automation (COMPLETE)
- Backend: 7 endpoints (send-link, preauthorize, capture, cancel, reminder, cron, status)
- Frontend: PaymentBlock avec statut, montants, 6 boutons d'action
- Cron: auto-envoi liens, auto-annulation 24h, auto-capture pré-auth
- Tests: 100% (18/18 backend, frontend vérifié) — iteration_53

### 2026-04-13 — Stripe Connect (COMPLETE)
- Backend: 10 endpoints (connect account, onboarding, products, checkout, webhook)
- Frontend: 5 composants + page dédiée /finance/stripe
- SQL: stripe_accounts, stripe_products tables
- Tests: 100% (17/17 backend, 100% frontend) — iteration_52
