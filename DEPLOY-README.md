# Flowtym PMS — Guide de Déploiement Production

## Architecture de Déploiement

```
flowtym.com (IONOS DNS)
├── app.flowtym.com  → Vercel (Frontend React/Vite)
├── api.flowtym.com  → Railway (Backend FastAPI)
└── Supabase Cloud   → PostgreSQL + Auth + Realtime
```

## Prérequis

- [x] Compte Supabase (projet créé)
- [ ] Compte Vercel (https://vercel.com)
- [ ] Compte Railway (https://railway.app)
- [ ] Compte GitHub (repo créé)
- [ ] Accès DNS IONOS

---

## Étape 1 : Base de données Supabase

### 1.1 Exécuter les scripts SQL

Dans **Supabase Dashboard → SQL Editor**, exécutez dans cet ordre :

| # | Fichier | Description |
|---|---------|-------------|
| 1 | `flowtym-final.sql` | Tables core (hotels, rooms, reservations, guests, etc.) + RLS + seed |
| 2 | `flowtym-automation.sql` | Moteur de règles yield management |
| 3 | `flowtym-payments.sql` | Tables paiements (Stripe, Adyen, PayPal) |

### 1.2 Créer les utilisateurs Auth

```bash
cd backend
python seed_supabase.py
```

### 1.3 Vérifier

```sql
SELECT 'hotels' AS t, COUNT(*) FROM hotels
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL SELECT 'users', COUNT(*) FROM users;
-- Attendu: 1 hôtel, 11 chambres, 7 réservations, 5 utilisateurs
```

---

## Étape 2 : Backend → Railway

### 2.1 Préparation

Le fichier `Procfile` et `railway.toml` sont déjà créés par `deploy.sh`.

### 2.2 Déploiement

```bash
cd backend
railway login
railway init --name flowtym-backend
railway up
```

### 2.3 Variables d'environnement

```bash
railway variables set SUPABASE_URL=https://mqdftrilwqdsnvryejsb.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJ...
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJ...
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set SMTP_HOST=smtp.ionos.fr
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=contact@flowtym.com
railway variables set SMTP_PASSWORD=****
railway variables set EMAIL_FROM=noreply@flowtym.com
```

### 2.4 Domaine personnalisé

```bash
railway domain --set api.flowtym.com
```

Railway vous donnera un CNAME à configurer chez IONOS.

### 2.5 Vérifier

```bash
curl https://api.flowtym.com/api/health
# Attendu: {"status":"healthy",...}
```

---

## Étape 3 : Frontend → Vercel

### 3.1 Déploiement

```bash
cd frontend
vercel login
vercel --prod
```

### 3.2 Variables d'environnement

Dans **Vercel Dashboard → Settings → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `VITE_BACKEND_URL` | `https://api.flowtym.com` |
| `VITE_SUPABASE_URL` | `https://mqdftrilwqdsnvryejsb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

### 3.3 Domaine personnalisé

```bash
vercel domains add app.flowtym.com
```

Vercel vous donnera un enregistrement CNAME (`cname.vercel-dns.com`).

### 3.4 Vérifier

```bash
curl https://app.flowtym.com
# Attendu: HTML de l'application
```

---

## Étape 4 : DNS IONOS

Connectez-vous au panneau IONOS et ajoutez :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| CNAME | app | cname.vercel-dns.com | 300 |
| CNAME | api | [CNAME Railway fourni] | 300 |
| CNAME | www | flowtym.com | 300 |
| A | @ | 76.76.21.21 (Vercel) | 300 |

**Propagation DNS** : 5 min à 48h selon les DNS.

---

## Étape 5 : Webhooks

### Stripe

1. https://dashboard.stripe.com/webhooks → **Add endpoint**
2. URL : `https://api.flowtym.com/api/payments/webhook/stripe`
3. Événements : `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`, `charge.refunded`
4. Copiez le `whsec_...` → `STRIPE_WEBHOOK_SECRET`

### Adyen

1. Adyen Console → **Webhooks** → **Configure**
2. URL : `https://api.flowtym.com/api/payments/webhook/adyen`
3. Événements : `AUTHORISATION`, `CAPTURE`, `REFUND`

### PayPal

1. https://developer.paypal.com → **Webhooks** → **Add**
2. URL : `https://api.flowtym.com/api/payments/webhook/paypal`
3. Événements : `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

---

## Étape 6 : CI/CD GitHub Actions

### 6.1 Secrets GitHub

Dans **GitHub → Repo → Settings → Secrets → Actions** :

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | URL Supabase |
| `SUPABASE_ANON_KEY` | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `RAILWAY_TOKEN` | Token Railway (Settings → Tokens) |
| `VERCEL_TOKEN` | Token Vercel (Settings → Tokens) |
| `VERCEL_ORG_ID` | ID organisation Vercel |
| `VERCEL_PROJECT_ID` | ID projet Vercel |

### 6.2 Déclencher

Chaque push sur `main` déclenchera automatiquement :
1. Tests backend (pytest)
2. Build frontend (yarn build)
3. Déploiement backend (Railway)
4. Déploiement frontend (Vercel)
5. Vérification health check

---

## Vérifications Post-Déploiement

```bash
# 1. Backend health
curl https://api.flowtym.com/api/health

# 2. Frontend accessible
curl -I https://app.flowtym.com

# 3. Dashboard KPIs
curl https://api.flowtym.com/api/pms/dashboard/HOTEL_ID

# 4. Login
# Ouvrez https://app.flowtym.com/login
# Email: admin@flowtym.com / Mot de passe: admin123

# 5. API PMS
curl https://api.flowtym.com/api/pms/rooms/HOTEL_ID
curl https://api.flowtym.com/api/pms/reservations/HOTEL_ID
```

---

## Rollback

### Backend
```bash
railway rollback
```

### Frontend
```bash
vercel rollback
```

---

## Support

- Supabase : https://supabase.com/dashboard
- Railway : https://railway.app/dashboard
- Vercel : https://vercel.com/dashboard
- Stripe : https://dashboard.stripe.com
