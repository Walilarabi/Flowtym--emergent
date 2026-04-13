#!/bin/bash
# ══════════════════════════════════════════════════════════
# FLOWTYM PMS — Script de Déploiement Production
# Déploie Backend (Railway) + Frontend (Vercel) + DNS (IONOS)
# ══════════════════════════════════════════════════════════

set -e

echo "══════════════════════════════════════════"
echo "  FLOWTYM PMS — Déploiement Production"
echo "══════════════════════════════════════════"

# ─── VARIABLES (à remplir ou via .env.deploy) ───
DOMAIN="flowtym.com"
FRONTEND_SUBDOMAIN="app.flowtym.com"
BACKEND_SUBDOMAIN="api.flowtym.com"

# Supabase
SUPABASE_URL="${SUPABASE_URL:-https://mqdftrilwqdsnvryejsb.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Stripe
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_live_xxx}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_xxx}"

# Email SMTP
SMTP_HOST="${SMTP_HOST:-smtp.ionos.fr}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-contact@flowtym.com}"
SMTP_PASSWORD="${SMTP_PASSWORD}"
EMAIL_FROM="${EMAIL_FROM:-noreply@flowtym.com}"

# ─── VÉRIFICATIONS ───
check_tool() {
  command -v "$1" >/dev/null 2>&1 || { echo "❌ $1 requis. Installez-le."; exit 1; }
}

echo ""
echo "[1/7] Vérification des outils..."
check_tool git
check_tool node
check_tool npm
echo "  ✅ git, node, npm installés"

# Vercel CLI
if ! command -v vercel &>/dev/null; then
  echo "  📦 Installation Vercel CLI..."
  npm install -g vercel
fi
echo "  ✅ Vercel CLI"

# Railway CLI
if ! command -v railway &>/dev/null; then
  echo "  📦 Installation Railway CLI..."
  npm install -g @railway/cli
fi
echo "  ✅ Railway CLI"

# ─── BACKEND — Railway ───
echo ""
echo "[2/7] Déploiement Backend sur Railway..."

cd /app/backend

# Créer Procfile si absent
cat > Procfile << 'EOF'
web: uvicorn server:app --host 0.0.0.0 --port $PORT
EOF

# Créer railway.toml
cat > railway.toml << 'EOF'
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
EOF

echo "  📤 Déploiement..."
echo "  ⚠️  Exécutez manuellement:"
echo "    cd /app/backend"
echo "    railway login"
echo "    railway init --name flowtym-backend"
echo "    railway up"
echo ""
echo "  Puis configurez les variables d'environnement:"
echo "    railway variables set SUPABASE_URL=$SUPABASE_URL"
echo "    railway variables set SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo "    railway variables set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
echo "    railway variables set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
echo "    railway variables set STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
echo "    railway variables set SMTP_HOST=$SMTP_HOST"
echo "    railway variables set SMTP_PORT=$SMTP_PORT"
echo "    railway variables set SMTP_USER=$SMTP_USER"
echo "    railway variables set SMTP_PASSWORD=****"
echo "    railway variables set EMAIL_FROM=$EMAIL_FROM"

# ─── FRONTEND — Vercel ───
echo ""
echo "[3/7] Préparation Frontend pour Vercel..."

cd /app/frontend

# Créer vercel.json
cat > vercel.json << EOF
{
  "buildCommand": "yarn build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://${BACKEND_SUBDOMAIN}/api/\$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
EOF

# Mettre à jour .env.production
cat > .env.production << EOF
VITE_BACKEND_URL=https://${BACKEND_SUBDOMAIN}
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
REACT_APP_BACKEND_URL=https://${BACKEND_SUBDOMAIN}
EOF

echo "  📤 Déploiement..."
echo "  ⚠️  Exécutez manuellement:"
echo "    cd /app/frontend"
echo "    vercel login"
echo "    vercel --prod"
echo ""
echo "  Puis configurez le domaine:"
echo "    vercel domains add ${FRONTEND_SUBDOMAIN}"

# ─── DNS — IONOS ───
echo ""
echo "[4/7] Configuration DNS IONOS..."
echo ""
echo "  ⚠️  Configurez manuellement dans le panneau IONOS:"
echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │ Type  │ Nom                │ Valeur                     │"
echo "  ├───────┼────────────────────┼────────────────────────────┤"
echo "  │ CNAME │ app.flowtym.com    │ cname.vercel-dns.com       │"
echo "  │ CNAME │ api.flowtym.com    │ [URL Railway fournie]      │"
echo "  │ CNAME │ www.flowtym.com    │ flowtym.com                │"
echo "  │ A     │ flowtym.com        │ 76.76.21.21 (Vercel)       │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
echo "  TTL recommandé: 300 secondes (5 min)"

# ─── WEBHOOKS ───
echo ""
echo "[5/7] Configuration Webhooks..."
echo ""
echo "  Stripe Dashboard → Developers → Webhooks → Add endpoint:"
echo "    URL: https://${BACKEND_SUBDOMAIN}/api/payments/webhook/stripe"
echo "    Events: payment_intent.succeeded, payment_intent.payment_failed,"
echo "            checkout.session.completed, charge.refunded"
echo ""
echo "  Adyen Console → Webhooks → Configure:"
echo "    URL: https://${BACKEND_SUBDOMAIN}/api/payments/webhook/adyen"
echo "    Events: AUTHORISATION, CAPTURE, REFUND"
echo ""
echo "  PayPal Developer → Webhooks → Add webhook:"
echo "    URL: https://${BACKEND_SUBDOMAIN}/api/payments/webhook/paypal"
echo "    Events: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED"

# ─── SUPABASE SQL ───
echo ""
echo "[6/7] Base de données Supabase..."
echo ""
echo "  Exécutez dans Supabase SQL Editor (dans cet ordre):"
echo "    1. /app/flowtym-final.sql       (tables core + seed)"
echo "    2. /app/flowtym-automation.sql   (moteur de règles)"
echo "    3. /app/flowtym-payments.sql     (paiements)"

# ─── VÉRIFICATION ───
echo ""
echo "[7/7] Vérifications post-déploiement..."
echo ""
echo "  Testez ces URLs après déploiement:"
echo ""
echo "  curl https://${BACKEND_SUBDOMAIN}/api/health"
echo "  curl https://${FRONTEND_SUBDOMAIN}"
echo "  curl -X POST https://${BACKEND_SUBDOMAIN}/api/pms/dashboard/HOTEL_ID"
echo ""
echo "  Login: admin@flowtym.com / admin123"

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Configuration terminée !"
echo "  Suivez les étapes manuelles ci-dessus."
echo "══════════════════════════════════════════"
