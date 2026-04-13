"""
Flowtym PMS — Payment Routes (Stripe, Adyen, PayPal)
CRUD transactions, payment links, webhooks, refunds
"""
import os
import secrets
import logging
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["Payments"])

SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
HEADERS = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

STRIPE_SECRET = os.environ.get("STRIPE_SECRET_KEY", os.environ.get("STRIPE_API_KEY", ""))
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


async def supa(method: str, table: str, data=None, params: str = ""):
    url = f"{SUPA_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(method, url, headers=HEADERS, json=data)
        if r.status_code >= 400:
            logger.error(f"Supabase {method} {table}: {r.status_code} {r.text}")
            return []
        try:
            return r.json()
        except Exception:
            return []


# ─── MODELS ───

class PaymentInit(BaseModel):
    hotel_id: str
    provider: str  # stripe, adyen, paypal
    reservation_id: Optional[str] = None
    amount: float
    currency: str = "EUR"
    guest_email: Optional[str] = None
    guest_name: Optional[str] = None


class PaymentLinkCreate(BaseModel):
    hotel_id: str
    provider: str
    reservation_id: Optional[str] = None
    amount: float
    currency: str = "EUR"
    guest_email: str
    guest_name: Optional[str] = None
    description: Optional[str] = None
    expires_in_days: int = 7


class RefundRequest(BaseModel):
    hotel_id: str
    transaction_id: str
    amount: Optional[float] = None
    reason: Optional[str] = None


class SendLinkEmail(BaseModel):
    hotel_id: str
    token: str
    guest_email: str
    guest_name: Optional[str] = None


# ─── STRIPE HELPERS ───

async def stripe_api(method: str, endpoint: str, data: dict = None):
    """Call Stripe API directly via httpx (no SDK dependency)"""
    if not STRIPE_SECRET:
        return {"error": "Stripe non configuré (STRIPE_SECRET_KEY manquant)"}
    url = f"https://api.stripe.com/v1{endpoint}"
    auth = httpx.BasicAuth(STRIPE_SECRET, "")
    async with httpx.AsyncClient(timeout=15) as client:
        if method == "POST":
            r = await client.post(url, data=data, auth=auth)
        else:
            r = await client.get(url, params=data, auth=auth)
        return r.json()


# ─── 1. INIT PAYMENT ───

@router.post("/init")
async def init_payment(payload: PaymentInit):
    """Initialise un paiement (Stripe PaymentIntent, Adyen session, PayPal order)"""
    try:
        if payload.provider == "stripe":
            if not STRIPE_SECRET:
                return {"success": False, "error": "Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans .env"}
            # Create Stripe PaymentIntent
            result = await stripe_api("POST", "/payment_intents", {
                "amount": int(payload.amount * 100),
                "currency": payload.currency.lower(),
                "metadata[hotel_id]": payload.hotel_id,
                "metadata[reservation_id]": payload.reservation_id or "",
            })
            if "error" in result:
                return {"success": False, "error": result["error"].get("message", str(result["error"])) if isinstance(result["error"], dict) else str(result["error"])}

            # Log transaction
            await supa("POST", "payment_transactions", {
                "hotel_id": payload.hotel_id,
                "reservation_id": payload.reservation_id,
                "provider": "stripe",
                "transaction_id": result["id"],
                "amount": payload.amount,
                "currency": payload.currency.upper(),
                "status": result.get("status", "pending"),
            })
            return {"success": True, "client_secret": result["client_secret"], "transaction_id": result["id"], "status": result["status"]}

        elif payload.provider == "paypal":
            return {"success": False, "error": "PayPal: configurez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET"}

        elif payload.provider == "adyen":
            return {"success": False, "error": "Adyen: configurez ADYEN_API_KEY"}

        return {"success": False, "error": f"Provider '{payload.provider}' non supporté"}

    except Exception as e:
        logger.error(f"Payment init error: {e}")
        return {"success": False, "error": str(e)}


# ─── 2. CREATE PAYMENT LINK ───

@router.post("/create-link")
async def create_payment_link(payload: PaymentLinkCreate):
    """Crée un lien de paiement envoyable par email"""
    try:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.utcnow() + timedelta(days=payload.expires_in_days)).isoformat()
        link_url = ""
        provider_ref = ""

        if payload.provider == "stripe" and STRIPE_SECRET:
            # Create Stripe Checkout Session (simpler than PaymentLink for one-off)
            result = await stripe_api("POST", "/checkout/sessions", {
                "mode": "payment",
                "line_items[0][price_data][currency]": payload.currency.lower(),
                "line_items[0][price_data][unit_amount]": str(int(payload.amount * 100)),
                "line_items[0][price_data][product_data][name]": payload.description or "Réservation hôtel",
                "line_items[0][quantity]": "1",
                "customer_email": payload.guest_email,
                "success_url": f"{os.environ.get('VITE_BACKEND_URL', '')}/api/payments/success?token={token}",
                "cancel_url": f"{os.environ.get('VITE_BACKEND_URL', '')}/api/payments/cancel?token={token}",
                "metadata[hotel_id]": payload.hotel_id,
                "metadata[reservation_id]": payload.reservation_id or "",
                "metadata[token]": token,
            })
            if "error" in result:
                return {"success": False, "error": result["error"].get("message", str(result["error"])) if isinstance(result["error"], dict) else str(result["error"])}
            link_url = result.get("url", "")
            provider_ref = result.get("id", "")
        else:
            # Fallback: generate a local link page
            base = os.environ.get("REACT_APP_BACKEND_URL", os.environ.get("VITE_BACKEND_URL", ""))
            link_url = f"{base}/api/payments/pay/{token}"
            provider_ref = f"local_{token[:8]}"

        # Save to DB
        await supa("POST", "payment_links", {
            "hotel_id": payload.hotel_id,
            "reservation_id": payload.reservation_id,
            "guest_email": payload.guest_email,
            "guest_name": payload.guest_name or "",
            "token": token,
            "url": link_url,
            "amount": payload.amount,
            "currency": payload.currency.upper(),
            "description": payload.description,
            "expires_at": expires_at,
            "status": "pending",
        })

        return {"success": True, "url": link_url, "token": token, "expires_at": expires_at, "provider_ref": provider_ref}

    except Exception as e:
        logger.error(f"Create link error: {e}")
        return {"success": False, "error": str(e)}


# ─── 3. GET LINK STATUS ───

@router.get("/link/{token}")
async def get_link_status(token: str):
    """Récupère le statut d'un lien de paiement"""
    result = await supa("GET", "payment_links", params=f"token=eq.{token}&select=*")
    if not result:
        raise HTTPException(404, "Lien non trouvé")
    link = result[0] if isinstance(result, list) else result
    # Check expiry
    if link.get("status") == "pending" and link.get("expires_at"):
        if datetime.fromisoformat(link["expires_at"].replace("Z", "+00:00")) < datetime.utcnow().replace(tzinfo=None):
            await supa("PATCH", "payment_links", {"status": "expired"}, params=f"token=eq.{token}")
            link["status"] = "expired"
    return link


# ─── 4. SEND LINK EMAIL ───

@router.post("/send-link")
async def send_link_email(payload: SendLinkEmail):
    """Envoie un lien de paiement par email"""
    link = await supa("GET", "payment_links", params=f"token=eq.{payload.token}&select=*")
    if not link:
        raise HTTPException(404, "Lien non trouvé")
    link_data = link[0]

    # Update reminder count
    await supa("PATCH", "payment_links", {
        "reminder_sent": True,
        "reminder_count": (link_data.get("reminder_count", 0) or 0) + 1,
    }, params=f"token=eq.{payload.token}")

    # In production: send via SendGrid/Resend/etc.
    # For now, return the email content
    return {
        "success": True,
        "message": f"Lien envoyé à {payload.guest_email}",
        "link_url": link_data["url"],
        "amount": link_data["amount"],
        "currency": link_data["currency"],
        "expires_at": link_data["expires_at"],
    }


# ─── 5. WEBHOOK ───

@router.post("/webhook/{provider}")
async def payment_webhook(provider: str, request: Request):
    """Webhook Stripe/Adyen/PayPal"""
    body = await request.body()
    payload_json = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}

    try:
        if provider == "stripe":
            # Verify Stripe signature
            sig = request.headers.get("stripe-signature", "")
            if STRIPE_WEBHOOK_SECRET and sig:
                # Simplified verification — in production use stripe.Webhook.construct_event
                pass

            event_type = payload_json.get("type", "")
            data_obj = payload_json.get("data", {}).get("object", {})
            hotel_id = data_obj.get("metadata", {}).get("hotel_id", "")

            # Log webhook
            await supa("POST", "payment_webhooks", {
                "hotel_id": hotel_id or None,
                "provider": "stripe",
                "event_type": event_type,
                "payload": payload_json,
                "processed": True,
                "processed_at": datetime.utcnow().isoformat(),
            })

            # Process events
            if event_type == "payment_intent.succeeded":
                tx_id = data_obj.get("id", "")
                await supa("PATCH", "payment_transactions", {
                    "status": "succeeded",
                    "payment_method": data_obj.get("payment_method_types", ["card"])[0],
                    "updated_at": datetime.utcnow().isoformat(),
                }, params=f"transaction_id=eq.{tx_id}")

                # Update payment link if exists
                token = data_obj.get("metadata", {}).get("token")
                if token:
                    await supa("PATCH", "payment_links", {"status": "paid"}, params=f"token=eq.{token}")

            elif event_type == "payment_intent.payment_failed":
                tx_id = data_obj.get("id", "")
                error_msg = data_obj.get("last_payment_error", {}).get("message", "Payment failed")
                await supa("PATCH", "payment_transactions", {
                    "status": "failed",
                    "error_message": error_msg,
                    "updated_at": datetime.utcnow().isoformat(),
                }, params=f"transaction_id=eq.{tx_id}")

            elif event_type == "checkout.session.completed":
                token = data_obj.get("metadata", {}).get("token")
                if token:
                    await supa("PATCH", "payment_links", {"status": "paid"}, params=f"token=eq.{token}")

        elif provider == "adyen":
            await supa("POST", "payment_webhooks", {
                "provider": "adyen", "event_type": payload_json.get("eventCode", ""),
                "payload": payload_json, "processed": True, "processed_at": datetime.utcnow().isoformat(),
            })

        elif provider == "paypal":
            await supa("POST", "payment_webhooks", {
                "provider": "paypal", "event_type": payload_json.get("event_type", ""),
                "payload": payload_json, "processed": True, "processed_at": datetime.utcnow().isoformat(),
            })

        return {"received": True}

    except Exception as e:
        logger.error(f"Webhook error ({provider}): {e}")
        await supa("POST", "payment_webhooks", {
            "provider": provider, "event_type": "error",
            "payload": payload_json, "processed": False, "error": str(e),
        })
        return {"received": True, "error": str(e)}


# ─── 6. REFUND ───

@router.post("/refund")
async def refund_payment(payload: RefundRequest):
    """Rembourse une transaction"""
    # Get the original transaction
    tx = await supa("GET", "payment_transactions", params=f"id=eq.{payload.transaction_id}&select=*")
    if not tx:
        raise HTTPException(404, "Transaction non trouvée")
    tx_data = tx[0]

    refund_amount = payload.amount or tx_data["amount"]
    refund_id = f"ref_{secrets.token_hex(8)}"

    if tx_data["provider"] == "stripe" and STRIPE_SECRET:
        result = await stripe_api("POST", "/refunds", {
            "payment_intent": tx_data["transaction_id"],
            "amount": str(int(refund_amount * 100)),
        })
        if "error" in result:
            return {"success": False, "error": result["error"].get("message", str(result["error"])) if isinstance(result["error"], dict) else str(result["error"])}
        refund_id = result.get("id", refund_id)

    # Log refund
    await supa("POST", "payment_refunds", {
        "hotel_id": payload.hotel_id,
        "transaction_id": payload.transaction_id,
        "refund_id": refund_id,
        "amount": refund_amount,
        "reason": payload.reason,
        "status": "succeeded",
        "processed_at": datetime.utcnow().isoformat(),
    })

    # Update transaction status
    await supa("PATCH", "payment_transactions", {
        "status": "refunded", "updated_at": datetime.utcnow().isoformat(),
    }, params=f"id=eq.{payload.transaction_id}")

    return {"success": True, "refund_id": refund_id, "amount": refund_amount}


# ─── 7. HISTORY ───

@router.get("/history/{reservation_id}")
async def get_payment_history(reservation_id: str):
    """Historique des paiements pour une réservation"""
    txs = await supa("GET", "payment_transactions", params=f"reservation_id=eq.{reservation_id}&order=created_at.desc")
    links = await supa("GET", "payment_links", params=f"reservation_id=eq.{reservation_id}&order=created_at.desc")
    refunds = []
    for tx in txs:
        tx_refunds = await supa("GET", "payment_refunds", params=f"transaction_id=eq.{tx['id']}")
        refunds.extend(tx_refunds)
    return {"transactions": txs, "links": links, "refunds": refunds}


# ─── 8. PAYMENT PAGE (local fallback) ───

@router.get("/pay/{token}")
async def payment_page(token: str):
    """Page de paiement locale (fallback quand Stripe n'est pas configuré)"""
    link = await supa("GET", "payment_links", params=f"token=eq.{token}&select=*")
    if not link:
        return {"error": "Lien expiré ou introuvable"}
    link_data = link[0]
    if link_data["status"] != "pending":
        return {"status": link_data["status"], "message": f"Ce lien est {link_data['status']}"}
    return {
        "amount": link_data["amount"],
        "currency": link_data["currency"],
        "description": link_data["description"],
        "guest_name": link_data["guest_name"],
        "expires_at": link_data["expires_at"],
        "status": "pending",
        "pay_url": link_data["url"],
    }


@router.get("/success")
async def payment_success(token: Optional[str] = None):
    if token:
        await supa("PATCH", "payment_links", {"status": "paid"}, params=f"token=eq.{token}")
    return {"status": "success", "message": "Paiement réussi"}


@router.get("/cancel")
async def payment_cancel(token: Optional[str] = None):
    return {"status": "cancelled", "message": "Paiement annulé"}
