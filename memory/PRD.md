# FLOWTYM PMS — Product Requirements Document

## Vision
FLOWTYM PMS SaaS hotelier — 8 piliers modulaires

## Stack
- Backend: FastAPI (port 8001) + MongoDB legacy + Supabase PostgreSQL
- Frontend: React/Vite (port 3000) + Shadcn/UI
- DB: Supabase (50+ tables, RLS, Realtime)
- Auth: Supabase Auth
- Paiements: Stripe Connect + emergentintegrations
- Cron: Background scheduler (15min) pour paiements automatiques

## Modules livres

### Stripe Connect
- 10 endpoints `/api/stripe/`
- UI `/finance/stripe` — 3 onglets

### Payment Automation
- 7 endpoints `/api/payments/auto/`
- PaymentBlock dans ReservationDetail (onglet Paiement)
- 7 statuts: pending, link_sent, preauthorized, partial_paid, paid, failed, cancelled
- Cron: auto-envoi, auto-annulation, auto-capture

### Maintenance
- 4 endpoints `/api/maintenance/{hotel_id}/` (CRUD tickets, stats)
- UI complete avec filtres, stats, creation tickets
- SQL: `/app/flowtym-maintenance.sql`

### CRM
- Backend: `/api/crm/{hotel_id}/` (clients, segments, campaigns, workflows, analytics)
- Frontend: CRMDashboard avec 19 onglets
- Service Supabase: `crmService.js`

### Housekeeping V2 (complet)
- Reception, Direction, Gouvernante, Mobile
- Signalements, Objets trouves, Configuration

### Autres modules
- Flowboard, PMS, Channel Manager, Booking Engine, RMS, Staff, Config, Support, DataHub

## Credentials
- Admin: admin@flowtym.com / admin123
- Hotel: fae266ac-2f4c-4297-af9f-b3b988d86c5b

## Tests
- test_full_suite.py: 28/28 (Stripe, Payments, Maintenance, CRM, Health)
- iteration_52: Stripe Connect 17/17
- iteration_53: Payment Automation 18/18

## Deploiement
Voir `/app/DEPLOY-README.md`

## SQL a executer
1. flowtym-final.sql (FAIT)
2. flowtym-payments.sql (FAIT)
3. flowtym-stripe-connect.sql (FAIT)
4. flowtym-maintenance.sql (A EXECUTER)
5. flowtym-automation.sql (FAIT)

## Priorites restantes
- [ ] Configurer vraies cles Stripe
- [ ] Executer flowtym-maintenance.sql
- [ ] Integration email (SendGrid/Resend)
- [ ] Nettoyage MongoDB/NestJS
