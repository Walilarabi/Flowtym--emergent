# FLOWTYM PMS — Guide de Deploiement Production Final

## Architecture

```
flowtym.com
├── app.flowtym.com  → Vercel (Frontend React/Vite)
├── api.flowtym.com  → Railway (Backend FastAPI)
├── Supabase Cloud   → PostgreSQL + Auth + Realtime
└── Stripe Connect   → Paiements hotel
```

---

## 1. Base de donnees Supabase

### Scripts SQL (dans l'ordre)

| # | Fichier | Description | Status |
|---|---------|-------------|--------|
| 1 | `flowtym-final.sql` | Tables core (hotels, rooms, reservations, guests) + RLS + seed | EXECUTE |
| 2 | `flowtym-automation.sql` | Moteur de regles yield management | EXECUTE |
| 3 | `flowtym-payments.sql` | Tables paiements (transactions, links, webhooks, refunds) | EXECUTE |
| 4 | `flowtym-stripe-connect.sql` | Stripe Connect (stripe_accounts, stripe_products) | EXECUTE |
| 5 | `flowtym-cancellation-policies.sql` | Politiques d'annulation | EXECUTE |
| 6 | `flowtym-maintenance.sql` | Tickets de maintenance | A EXECUTER |
| 7 | `flowtym-sql-crm-staff.sql` | CRM + Staff tables | EXECUTE |
| 8 | `flowtym-sql-rls-policies.sql` | Politiques RLS multi-tenant | EXECUTE |

### Variables Supabase

```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 2. Backend (Railway)

### Variables d'environnement

```env
# MongoDB (legacy)
MONGO_URL=mongodb+srv://...
DB_NAME=flowtym

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Auth
JWT_SECRET=votre-secret-jwt-securise

# CORS
CORS_ORIGINS=https://app.flowtym.com
```

### Deploiement Railway

```bash
# Dans /app/backend/
railway init
railway link
railway up
```

### Fichier Procfile (deja present)
```
web: uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
```

### Endpoints principaux

| Module | Prefix | Endpoints |
|--------|--------|-----------|
| Auth | `/api/auth/` | login, register, me |
| Hotels | `/api/hotels/` | CRUD hotels |
| Rooms | `/api/hotels/{id}/rooms/` | CRUD rooms |
| Reservations | `/api/hotels/{id}/reservations/` | CRUD reservations |
| Payments (base) | `/api/payments/` | init, create-link, webhook, refund, history |
| Stripe Connect | `/api/stripe/` | connect-account, onboarding, products, checkout |
| Payment Automation | `/api/payments/auto/` | send-link, preauthorize, capture, cancel, reminder, cron, status |
| Maintenance | `/api/maintenance/{id}/` | tickets CRUD, stats |
| CRM | `/api/crm/{id}/` | clients, segments, campaigns, workflows, analytics |
| Automation | `/api/automation/` | rules, settings, execute |
| PMS Supabase | `/api/pms/` | dashboard, rooms, reservations, check-in/out |
| Housekeeping | `/api/housekeeping/` | tasks, inspections, assignments |
| Staff | `/api/staff/` | employees, shifts, payroll |
| Config | `/api/config/` | room-types, rate-plans, pricing-matrix |

---

## 3. Frontend (Vercel)

### Variables d'environnement

```env
VITE_BACKEND_URL=https://api.flowtym.com
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Deploiement Vercel

```bash
# Dans /app/frontend/
vercel --prod
```

### Configuration Vercel (vercel.json deja present)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 4. Stripe Configuration

### Dashboard Stripe
1. Creer un compte sur https://dashboard.stripe.com
2. Activer Stripe Connect (Settings > Connect)
3. Copier les cles API (Developers > API Keys)
4. Configurer le webhook:
   - URL: `https://api.flowtym.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copier le Webhook Secret

### Cles a configurer
```
STRIPE_API_KEY=sk_live_xxx        # Backend .env
STRIPE_WEBHOOK_SECRET=whsec_xxx   # Backend .env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # Frontend .env
```

---

## 5. Cron Job (Paiements automatiques)

Le cron job demarre automatiquement avec le backend (toutes les 15 minutes).

### Actions automatiques
- **Non-remboursable** : Envoi lien immediat + annulation auto apres 24h
- **Flexible (48h)** : Lien envoye 48h avant arrivee
- **Modere (7j)** : Lien envoye 7 jours avant
- **Semi-flexible (14j)** : Lien envoye 14 jours avant
- **Strict (30j)** : Lien envoye 30 jours avant
- **Pre-auth** : Capture automatique a l'echeance
- **Auto-annulation** : Si non paye 24h apres envoi du lien

### Declenchement manuel
```bash
curl -X POST https://api.flowtym.com/api/payments/auto/process-cron
```

---

## 6. DNS (IONOS)

```
app.flowtym.com  → CNAME → cname.vercel-dns.com
api.flowtym.com  → CNAME → [railway domain]
```

---

## 7. Tests

### Lancer les tests
```bash
cd /app/backend
python -m pytest tests/test_full_suite.py -v --tb=short
```

### Cartes de test Stripe
- Succes : `4242 4242 4242 4242`
- Refusee : `4000 0000 0000 0002`
- Auth 3DS : `4000 0025 0000 3155`

---

## 8. Structure des fichiers

```
/app/
├── backend/
│   ├── server.py                    # Point d'entree FastAPI
│   ├── cron_scheduler.py            # Cron automatique paiements
│   ├── routes/
│   │   ├── payments.py              # Paiements base (init, link, webhook, refund)
│   │   ├── stripe_connect.py        # Stripe Connect (comptes, produits, checkout)
│   │   ├── payment_automation.py    # Automatisation (envoi liens, preauth, cron)
│   │   ├── maintenance.py           # Tickets maintenance
│   │   ├── automation.py            # Yield management
│   │   └── pms_supabase.py          # PMS endpoints Supabase
│   ├── crm/routes.py                # CRM endpoints
│   ├── config/routes.py             # Configuration hotel
│   ├── staff/                       # Gestion personnel
│   ├── housekeeping/                # Module housekeeping
│   └── tests/
│       ├── test_full_suite.py       # Tests complets
│       ├── test_stripe_connect.py   # Tests Stripe
│       └── test_payment_automation.py # Tests automatisation
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── finance/
│   │   │   │   ├── FinanceModule.jsx          # Finance (Factures + Stripe)
│   │   │   │   └── StripeConnectPage.jsx      # Page Stripe Connect
│   │   │   ├── maintenance/
│   │   │   │   └── MaintenanceModule.jsx      # Maintenance Supabase
│   │   │   ├── crm/                           # Module CRM complet
│   │   │   ├── housekeeping/                  # Module Housekeeping
│   │   │   └── flowboard/Flowboard.jsx        # Dashboard central
│   │   ├── components/
│   │   │   ├── stripe/                        # Composants Stripe Connect
│   │   │   └── reservations/
│   │   │       ├── ReservationDetail.jsx      # Detail reservation (5 onglets)
│   │   │       └── PaymentBlock.jsx           # Bloc paiement automatise
│   │   └── services/crmService.js             # Service CRM Supabase
├── flowtym-final.sql                          # SQL tables core
├── flowtym-payments.sql                       # SQL paiements
├── flowtym-stripe-connect.sql                 # SQL Stripe Connect
├── flowtym-maintenance.sql                    # SQL maintenance
└── flowtym-automation.sql                     # SQL automatisation
```

---

## 9. Credentials de test

| Role | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@flowtym.com | admin123 |
| Reception | reception@hotel.com | reception123 |
| Gouvernante | gouvernante@hotel.com | gouv123 |
| Femme de chambre | femme1@hotel.com | femme123 |
| Maintenance | maintenance@hotel.com | maint123 |

Hotel ID: `fae266ac-2f4c-4297-af9f-b3b988d86c5b`

---

## 10. Checklist Pre-Production

- [ ] Executer `/app/flowtym-maintenance.sql` dans Supabase
- [ ] Configurer les vraies cles Stripe (sk_live, pk_live, whsec)
- [ ] Configurer le webhook Stripe dans le Dashboard
- [ ] Deployer backend sur Railway
- [ ] Deployer frontend sur Vercel
- [ ] Configurer les DNS IONOS
- [ ] Tester le flux de paiement de bout en bout
- [ ] Tester le cron job de paiement automatique
- [ ] Configurer CORS pour le domaine production
