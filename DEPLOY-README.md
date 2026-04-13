# FLOWTYM PMS — Guide de Deploiement Production

## Architecture Finale

```
┌─────────────────────────────────────────────────────────────┐
│                     flowtym.com (IONOS)                     │
├──────────────────┬──────────────────┬───────────────────────┤
│  www.flowtym.com │  app.flowtym.com │   api.flowtym.com     │
│  Site vitrine    │  SaaS Frontend   │   API Backend         │
│  (WordPress/     │  (Vercel)        │   (Railway)           │
│   Framer/autre)  │  React/Vite      │   FastAPI             │
└──────────────────┴──────────────────┴───────────────────────┘
                                            │
                                    ┌───────┴───────┐
                                    │   Supabase    │
                                    │  PostgreSQL   │
                                    │  Auth+Realtime│
                                    └───────────────┘
```

---

## 1. Pre-requis

- [x] Projet Supabase cree (50+ tables, RLS, Realtime)
- [ ] Compte Vercel (https://vercel.com)
- [ ] Compte Railway (https://railway.app)
- [ ] Acces DNS IONOS
- [ ] Cles Stripe (https://dashboard.stripe.com/apikeys)

---

## 2. Deployer le Frontend (Vercel → app.flowtym.com)

### 2.1 Variables d'environnement Vercel

```
VITE_BACKEND_URL = https://api.flowtym.com
VITE_SUPABASE_URL = https://mqdftrilwqdsnvryejsb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ... (votre cle anon)
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_xxx
```

### 2.2 Commandes

```bash
cd frontend
cp .env.production .env
yarn build
vercel --prod
vercel domains add app.flowtym.com
```

### 2.3 Config Vercel (vercel.json)
- Build: `yarn build`
- Output: `dist`
- Framework: Vite
- Rewrites: `/api/*` → `https://api.flowtym.com/api/*`
- SPA fallback: `/(*)` → `/index.html`

---

## 3. Deployer le Backend (Railway → api.flowtym.com)

### 3.1 Variables d'environnement Railway

```
MONGO_URL = mongodb+srv://... (votre MongoDB Atlas)
DB_NAME = flowtym
SUPABASE_URL = https://mqdftrilwqdsnvryejsb.supabase.co
SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
STRIPE_API_KEY = sk_live_xxx
STRIPE_WEBHOOK_SECRET = whsec_xxx
JWT_SECRET = (generer: openssl rand -hex 32)
FRONTEND_URL = https://app.flowtym.com
CORS_ORIGINS = https://app.flowtym.com,https://www.flowtym.com
```

### 3.2 Commandes

```bash
cd backend
railway login
railway up
railway domain add api.flowtym.com
```

### 3.3 Config Railway (railway.toml)
- Builder: nixpacks
- Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Healthcheck: `/api/health`

---

## 4. DNS IONOS

| Type  | Nom  | Cible                          |
|-------|------|--------------------------------|
| CNAME | app  | cname.vercel-dns.com           |
| CNAME | api  | [projet].up.railway.app        |
| A     | www  | [IP hebergeur site vitrine]    |

---

## 5. Stripe Webhook

Dashboard Stripe → Developers → Webhooks → Add endpoint

```
URL: https://api.flowtym.com/api/stripe/webhook

Events a ecouter:
  ✓ checkout.session.completed
  ✓ payment_intent.succeeded
  ✓ payment_intent.payment_failed
```

Copier le **Signing Secret** (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`.

---

## 6. SQL Supabase (execute dans l'ordre)

| # | Fichier | Status |
|---|---------|--------|
| 1 | `flowtym-final.sql` | EXECUTE |
| 2 | `flowtym-automation.sql` | EXECUTE |
| 3 | `flowtym-payments.sql` | EXECUTE |
| 4 | `flowtym-stripe-connect.sql` | EXECUTE |
| 5 | `flowtym-cancellation-policies.sql` | EXECUTE |
| 6 | `flowtym-sql-crm-staff.sql` | EXECUTE |
| 7 | `flowtym-sql-rls-policies.sql` | EXECUTE |
| 8 | `flowtym-maintenance.sql` | A EXECUTER |

---

## 7. Cron Job Automatique

Le cron demarre automatiquement avec le backend (toutes les 15 min).
Aucune configuration requise.

Actions:
- Auto-envoi liens de paiement selon politique d'annulation
- Auto-annulation si non paye sous 24h
- Auto-capture preautorisation a l'echeance

---

## 8. Endpoints API (api.flowtym.com)

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/api/auth/` | Login, Register, Me |
| Hotels | `/api/hotels/` | CRUD Hotels |
| PMS | `/api/pms/` | Dashboard, Rooms, Reservations Supabase |
| Stripe Connect | `/api/stripe/` | Connect accounts, Products, Checkout |
| Payment Auto | `/api/payments/auto/` | Send-link, Preauth, Capture, Cron |
| Payments | `/api/payments/` | Init, Link, Webhook, Refund |
| Maintenance | `/api/maintenance/{id}/` | Tickets CRUD, Stats |
| CRM | `/api/crm/{id}/` | Clients, Segments, Campaigns |
| Housekeeping | `/api/housekeeping/` | Tasks, Inspections |
| Config | `/api/config/` | Room types, Rate plans |
| Staff | `/api/staff/` | Employees, Shifts, Payroll |
| Automation | `/api/automation/` | Yield management rules |

---

## 9. Checklist Finale

```
[ ] Executer flowtym-maintenance.sql dans Supabase
[ ] Deployer backend sur Railway
[ ] Configurer variables Railway (Stripe, Supabase, JWT, CORS)
[ ] Deployer frontend sur Vercel
[ ] Configurer variables Vercel (VITE_BACKEND_URL, etc.)
[ ] Configurer DNS IONOS (app → Vercel, api → Railway)
[ ] Attendre propagation DNS (1-24h)
[ ] Configurer webhook Stripe → https://api.flowtym.com/api/stripe/webhook
[ ] Tester login sur https://app.flowtym.com
[ ] Tester paiement Stripe (carte test 4242...)
[ ] Tester cron: POST https://api.flowtym.com/api/payments/auto/process-cron
```

---

## 10. Cartes de Test Stripe

| Type | Numero |
|------|--------|
| Succes | 4242 4242 4242 4242 |
| Refusee | 4000 0000 0000 0002 |
| 3D Secure | 4000 0025 0000 3155 |
| Fonds insuffisants | 4000 0000 0000 9995 |
