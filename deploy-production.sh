#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# FLOWTYM — Script de deploiement production
# Domaines:
#   www.flowtym.com  → Site vitrine
#   app.flowtym.com  → SaaS Frontend (Vercel)
#   api.flowtym.com  → API Backend (Railway)
# ═══════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════╗"
echo "║   FLOWTYM PMS — Deploiement Prod      ║"
echo "╚═══════════════════════════════════════╝"

# ─── 1. FRONTEND (Vercel) ───
echo ""
echo "▶ 1/3 — Frontend → app.flowtym.com"
echo "   Copier .env.production → .env"

cd frontend
cp .env.production .env
echo "   Variables production appliquees"

echo "   Build..."
yarn build

echo "   Deploy Vercel..."
echo "   → vercel --prod"
echo "   → vercel domains add app.flowtym.com"
echo ""

# ─── 2. BACKEND (Railway) ───
echo "▶ 2/3 — Backend → api.flowtym.com"
cd ../backend
cp .env.production .env
echo "   Variables production appliquees"

echo "   ⚠  IMPORTANT: Configurer dans Railway Dashboard:"
echo "   → SUPABASE_URL"
echo "   → SUPABASE_SERVICE_ROLE_KEY"
echo "   → STRIPE_API_KEY (votre vraie cle)"
echo "   → STRIPE_WEBHOOK_SECRET"
echo "   → FRONTEND_URL=https://app.flowtym.com"
echo "   → CORS_ORIGINS=https://app.flowtym.com,https://www.flowtym.com"
echo "   → JWT_SECRET (generer un secret securise)"
echo ""

echo "   Deploy Railway..."
echo "   → railway up"
echo "   → railway domain add api.flowtym.com"
echo ""

# ─── 3. DNS (IONOS) ───
echo "▶ 3/3 — DNS IONOS"
echo "   Configurer dans IONOS DNS Manager:"
echo ""
echo "   ┌─────────┬──────────┬────────────────────────────────────┐"
echo "   │ Type    │ Nom      │ Cible                              │"
echo "   ├─────────┼──────────┼────────────────────────────────────┤"
echo "   │ CNAME   │ app      │ cname.vercel-dns.com               │"
echo "   │ CNAME   │ api      │ [votre-domaine].up.railway.app     │"
echo "   │ A/CNAME │ www      │ [votre hebergeur site vitrine]     │"
echo "   └─────────┴──────────┴────────────────────────────────────┘"
echo ""

# ─── 4. STRIPE WEBHOOK ───
echo "▶ 4 — Stripe Webhook"
echo "   Dashboard Stripe → Developers → Webhooks"
echo "   URL: https://api.flowtym.com/api/stripe/webhook"
echo "   Events:"
echo "     ✓ checkout.session.completed"
echo "     ✓ payment_intent.succeeded"
echo "     ✓ payment_intent.payment_failed"
echo ""

echo "╔═══════════════════════════════════════╗"
echo "║   ✅ Configuration terminee            ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "URLs finales:"
echo "  🌐 www.flowtym.com   → Site vitrine"
echo "  🏨 app.flowtym.com   → SaaS Flowtym"
echo "  🔧 api.flowtym.com   → API Backend"
echo ""
