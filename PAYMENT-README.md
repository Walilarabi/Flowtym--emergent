# Flowtym PMS — Module Paiements

## Architecture

```
Client (PMS) → API FastAPI → Stripe/Adyen/PayPal API → Webhook → Supabase
```

## Déploiement

### 1. Créer les tables

Exécutez `/app/flowtym-payments.sql` dans **Supabase SQL Editor**.

### 2. Configurer les clés API

Ajoutez dans `/app/backend/.env` :

```env
# Stripe (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Adyen (https://ca-test.adyen.com/ca/ca/config/api_credentials_new.shtml)
ADYEN_API_KEY=AQE...
ADYEN_ENVIRONMENT=test

# PayPal (https://developer.paypal.com/dashboard/applications)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
```

### 3. Configurer les webhooks

| Provider | URL Webhook | Événements |
|----------|------------|------------|
| Stripe | `https://votre-domaine/api/payments/webhook/stripe` | `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed` |
| Adyen | `https://votre-domaine/api/payments/webhook/adyen` | `AUTHORISATION`, `CAPTURE`, `REFUND` |
| PayPal | `https://votre-domaine/api/payments/webhook/paypal` | `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED` |

### 4. Redémarrer le backend

```bash
sudo supervisorctl restart backend
```

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/payments/init` | Initialise un paiement (Stripe PaymentIntent) |
| POST | `/api/payments/create-link` | Crée un lien de paiement envoyable par email |
| GET | `/api/payments/link/{token}` | Récupère le statut d'un lien |
| POST | `/api/payments/send-link` | Envoie le lien par email (mise à jour compteur) |
| POST | `/api/payments/webhook/{provider}` | Webhook Stripe/Adyen/PayPal |
| POST | `/api/payments/refund` | Rembourse une transaction |
| GET | `/api/payments/history/{reservation_id}` | Historique complet (transactions + liens + remboursements) |
| GET | `/api/payments/pay/{token}` | Page de paiement locale (fallback) |
| GET | `/api/payments/success` | Callback succès |
| GET | `/api/payments/cancel` | Callback annulation |

## Tests

### Paiement réussi (Stripe)
```bash
curl -X POST $API_URL/api/payments/init \
  -H "Content-Type: application/json" \
  -d '{"hotel_id":"HOTEL_ID","provider":"stripe","amount":120,"reservation_id":"RESA_ID"}'
```

### Créer un lien de paiement
```bash
curl -X POST $API_URL/api/payments/create-link \
  -H "Content-Type: application/json" \
  -d '{"hotel_id":"HOTEL_ID","provider":"stripe","amount":360,"guest_email":"client@email.com","guest_name":"Sophie Laurent","description":"Réservation 3 nuits","expires_in_days":7}'
```

### Vérifier un lien
```bash
curl $API_URL/api/payments/link/TOKEN_DU_LIEN
```

### Historique d'une réservation
```bash
curl $API_URL/api/payments/history/RESA_ID
```

### Remboursement
```bash
curl -X POST $API_URL/api/payments/refund \
  -H "Content-Type: application/json" \
  -d '{"hotel_id":"HOTEL_ID","transaction_id":"TX_ID","amount":120,"reason":"Annulation"}'
```

## Cartes de test Stripe

| Numéro | Résultat |
|--------|----------|
| 4242 4242 4242 4242 | Succès |
| 4000 0000 0000 0002 | Refusée |
| 4000 0000 0000 3220 | 3D Secure |

## Sécurité

- Clés API en variables d'environnement uniquement
- Webhooks vérifiés par signature (Stripe `whsec_`)
- RLS activé sur toutes les tables (isolation par hotel_id)
- Pas de stockage de données carte (PCI compliance via providers)
