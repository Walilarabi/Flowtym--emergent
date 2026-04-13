"""
Flowtym PMS — Payment Automation Routes
Automatic payment links, pre-authorization, reminders, auto-cancellation.
"""
import os
import logging
import stripe
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments/auto", tags=["Payment Automation"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPA_HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

stripe.api_key = STRIPE_API_KEY

# Payment status constants
PAYMENT_STATUSES = {
    "pending": "En attente",
    "link_sent": "Lien envoye",
    "preauthorized": "Carte preautorisee",
    "partial_paid": "Acompte paye",
    "paid": "Paye en totalite",
    "failed": "Echoue",
    "cancelled": "Annulee",
}

# Cancellation policy deadlines (hours before check-in)
POLICY_DEADLINES = {
    "flexible": 48,
    "moderate": 168,       # 7 days
    "semi_flexible": 336,  # 14 days
    "strict": 720,         # 30 days
    "non_refundable": 0,   # Immediate
}


# ─── SUPABASE HELPER ───
async def supa(method: str, table: str, data=None, params: str = ""):
    url = f"{SUPA_URL}/rest/v1/{table}"
    if params:
        url += f"?{params}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.request(method, url, headers=SUPA_HEADERS, json=data)
        if r.status_code >= 400:
            logger.error(f"Supabase {method} {table}: {r.status_code} {r.text}")
            return []
        try:
            return r.json()
        except Exception:
            return []


async def get_reservation(reservation_id: str):
    res = await supa("GET", "reservations", params=f"id=eq.{reservation_id}&select=*")
    if not res or (isinstance(res, list) and len(res) == 0):
        return None
    return res[0] if isinstance(res, list) else res


async def update_reservation(reservation_id: str, data: dict):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    return await supa("PATCH", "reservations", data, params=f"id=eq.{reservation_id}")


# ─── REQUEST MODELS ───
class SendLinkRequest(BaseModel):
    hotel_id: str
    reservation_id: str
    amount_type: str = "total"  # total, deposit, first_night, custom
    custom_amount: Optional[float] = None
    guest_email: Optional[str] = None
    send_email: bool = True

class PreauthorizeRequest(BaseModel):
    hotel_id: str
    reservation_id: str
    amount_type: str = "first_night"  # first_night, percentage, total
    percentage: Optional[float] = None  # For percentage type
    card_token: Optional[str] = None  # Optional: for direct card pre-auth

class CaptureRequest(BaseModel):
    hotel_id: str
    reservation_id: str
    amount: Optional[float] = None  # Partial capture

class CancelPreauthRequest(BaseModel):
    hotel_id: str
    reservation_id: str

class ReminderRequest(BaseModel):
    hotel_id: str
    reservation_id: str
    guest_email: Optional[str] = None


# ─── 1. GET PAYMENT STATUS ───
@router.get("/status/{reservation_id}")
async def get_payment_status(reservation_id: str):
    """Get full payment status for a reservation"""
    res = await get_reservation(reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation non trouvee")

    check_in = res.get("check_in", "")  # noqa: F841
    payment_deadline = res.get("payment_deadline")
    rate_type = res.get("rate_type", "standard")

    # Calculate time to deadline
    time_to_deadline = None
    deadline_label = None
    if payment_deadline:
        try:
            deadline_dt = datetime.fromisoformat(payment_deadline.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            diff = deadline_dt - now
            hours_left = diff.total_seconds() / 3600
            if hours_left > 24:
                days = int(hours_left / 24)
                deadline_label = f"{days}j {int(hours_left % 24)}h avant echeance"
            elif hours_left > 0:
                deadline_label = f"{int(hours_left)}h{int((hours_left % 1) * 60):02d} avant echeance"
            else:
                deadline_label = "Echeance depassee"
            time_to_deadline = round(hours_left, 1)
        except Exception:
            pass

    # Get payment links
    links = await supa("GET", "payment_links",
                       params=f"reservation_id=eq.{reservation_id}&order=created_at.desc&limit=5")

    # Get transactions
    txs = await supa("GET", "payment_transactions",
                     params=f"reservation_id=eq.{reservation_id}&order=created_at.desc&limit=10")

    return {
        "reservation_id": reservation_id,
        "payment_status": res.get("payment_status", "pending"),
        "payment_status_label": PAYMENT_STATUSES.get(res.get("payment_status", "pending"), "Inconnu"),
        "total_amount": res.get("total_amount", 0),
        "paid_amount": res.get("paid_amount", 0),
        "balance": res.get("balance", 0),
        "rate_type": rate_type,
        "payment_deadline": payment_deadline,
        "deadline_label": deadline_label,
        "time_to_deadline_hours": time_to_deadline,
        "payment_link_sent": res.get("payment_link_sent", False),
        "manual_payment_link_sent": res.get("manual_payment_link_sent", False),
        "preauthorization_amount": res.get("preauthorization_amount"),
        "preauthorization_id": res.get("preauthorization_id"),
        "preauthorization_status": res.get("preauthorization_status"),
        "links": links if isinstance(links, list) else [],
        "transactions": txs if isinstance(txs, list) else [],
    }


# ─── 2. SEND PAYMENT LINK (MANUAL) ───
@router.post("/send-link")
async def send_payment_link(req: SendLinkRequest):
    """Send a payment link manually (reception action)"""
    res = await get_reservation(req.reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation non trouvee")

    # Calculate amount
    total = res.get("total_amount", 0)
    paid = res.get("paid_amount", 0)
    balance = total - paid
    room_rate = res.get("room_rate", 0)

    if req.amount_type == "total":
        amount = balance
    elif req.amount_type == "deposit":
        amount = round(total * 0.3, 2)  # 30% deposit
    elif req.amount_type == "first_night":
        amount = room_rate
    elif req.amount_type == "custom" and req.custom_amount:
        amount = req.custom_amount
    else:
        amount = balance

    if amount <= 0:
        return {"success": False, "error": "Aucun montant a payer"}

    guest_email = req.guest_email or res.get("client_email", "")
    guest_name = res.get("client_name", "Client")
    description = f"Reservation {res.get('room_number', '')} — {res.get('check_in', '')[:10]} au {res.get('check_out', '')[:10]}"

    # Create payment link via existing payments API
    from routes.payments import create_payment_link, PaymentLinkCreate
    link_payload = PaymentLinkCreate(
        hotel_id=req.hotel_id,
        provider="stripe",
        reservation_id=req.reservation_id,
        amount=float(amount),
        currency="EUR",
        guest_email=guest_email,
        guest_name=guest_name,
        description=description,
    )

    try:
        result = await create_payment_link(link_payload)
    except Exception as e:
        logger.error(f"Create link error: {e}")
        result = {"success": False, "error": str(e)}

    if result.get("success"):
        await update_reservation(req.reservation_id, {
            "payment_status": "link_sent",
            "payment_link_sent": True,
            "manual_payment_link_sent": True,
        })

        return {
            "success": True,
            "amount": amount,
            "link_url": result.get("url", ""),
            "token": result.get("token", ""),
            "guest_email": guest_email,
            "message": f"Lien de paiement de {amount:.2f} EUR envoye a {guest_email}",
        }

    return {"success": False, "error": result.get("error", "Erreur creation lien")}


# ─── 3. PREAUTHORIZE CARD ───
@router.post("/preauthorize")
async def preauthorize_card(req: PreauthorizeRequest):
    """Pre-authorize a card for a reservation"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=400, detail="Stripe non configure")

    res = await get_reservation(req.reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation non trouvee")

    total = res.get("total_amount", 0)
    room_rate = res.get("room_rate", 0)

    # Calculate pre-auth amount
    if req.amount_type == "first_night":
        amount = room_rate
    elif req.amount_type == "percentage":
        pct = req.percentage or 30
        amount = round(total * pct / 100, 2)
    else:  # total
        amount = total

    if amount <= 0:
        return {"success": False, "error": "Montant invalide"}

    try:
        # Create PaymentIntent with capture_method=manual (pre-authorization)
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency="eur",
            capture_method="manual",
            metadata={
                "hotel_id": req.hotel_id,
                "reservation_id": req.reservation_id,
                "type": "preauthorization",
            },
        )

        await update_reservation(req.reservation_id, {
            "payment_status": "preauthorized",
            "preauthorization_amount": amount,
            "preauthorization_id": intent.id,
            "preauthorization_status": "pending",
        })

        # Log transaction
        await supa("POST", "payment_transactions", {
            "hotel_id": req.hotel_id,
            "reservation_id": req.reservation_id,
            "provider": "stripe",
            "transaction_id": intent.id,
            "amount": amount,
            "currency": "EUR",
            "status": "preauthorized",
        })

        return {
            "success": True,
            "preauth_id": intent.id,
            "amount": amount,
            "client_secret": intent.client_secret,
            "message": f"Preautorisation de {amount:.2f} EUR creee",
        }

    except stripe.error.StripeError as e:
        logger.error(f"Preauth error: {e}")
        await update_reservation(req.reservation_id, {
            "preauthorization_status": "failed",
        })
        return {"success": False, "error": str(e.user_message or e)}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ─── 4. CAPTURE PRE-AUTH ───
@router.post("/capture-preauth")
async def capture_preauth(req: CaptureRequest):
    """Capture a pre-authorized payment"""
    res = await get_reservation(req.reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation non trouvee")

    preauth_id = res.get("preauthorization_id")
    if not preauth_id:
        return {"success": False, "error": "Aucune preautorisation trouvee"}

    try:
        capture_params = {}
        if req.amount:
            capture_params["amount_to_capture"] = int(req.amount * 100)

        intent = stripe.PaymentIntent.capture(preauth_id, **capture_params)
        captured_amount = intent.amount_received / 100.0

        new_paid = res.get("paid_amount", 0) + captured_amount
        new_balance = res.get("total_amount", 0) - new_paid
        new_status = "paid" if new_balance <= 0 else "partial_paid"

        await update_reservation(req.reservation_id, {
            "payment_status": new_status,
            "paid_amount": new_paid,
            "balance": new_balance,
            "preauthorization_status": "captured",
        })

        await supa("PATCH", "payment_transactions", {
            "status": "succeeded",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, params=f"transaction_id=eq.{preauth_id}")

        return {
            "success": True,
            "captured_amount": captured_amount,
            "new_balance": new_balance,
            "message": f"Preautorisation capturee : {captured_amount:.2f} EUR",
        }

    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e.user_message or e)}


# ─── 5. CANCEL PRE-AUTH ───
@router.post("/cancel-preauth")
async def cancel_preauth(req: CancelPreauthRequest):
    """Cancel a pre-authorized payment"""
    res = await get_reservation(req.reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation non trouvee")

    preauth_id = res.get("preauthorization_id")
    if not preauth_id:
        return {"success": False, "error": "Aucune preautorisation trouvee"}

    try:
        stripe.PaymentIntent.cancel(preauth_id)

        await update_reservation(req.reservation_id, {
            "preauthorization_status": "cancelled",
            "preauthorization_amount": None,
            "preauthorization_id": None,
            "payment_status": "pending",
        })

        await supa("PATCH", "payment_transactions", {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, params=f"transaction_id=eq.{preauth_id}")

        return {"success": True, "message": "Preautorisation annulee"}

    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e.user_message or e)}


# ─── 6. SEND REMINDER ───
@router.post("/send-reminder")
async def send_reminder(req: ReminderRequest):
    """Send a payment reminder"""
    res = await get_reservation(req.reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservation non trouvee")

    guest_email = req.guest_email or res.get("client_email", "")

    # Get existing payment link
    links = await supa("GET", "payment_links",
                       params=f"reservation_id=eq.{req.reservation_id}&status=eq.pending&order=created_at.desc&limit=1")

    if links and isinstance(links, list) and len(links) > 0:
        link = links[0]
        link_url = link.get("url", "")
        amount = link.get("amount", 0)

        # Increment reminder count
        await supa("PATCH", "payment_links", {
            "reminder_sent": True,
            "reminder_count": (link.get("reminder_count") or 0) + 1,
        }, params=f"id=eq.{link['id']}")

        return {
            "success": True,
            "message": f"Rappel envoye a {guest_email}",
            "link_url": link_url,
            "amount": amount,
            "reminder_count": (link.get("reminder_count") or 0) + 1,
        }

    return {"success": False, "error": "Aucun lien de paiement en attente. Envoyez d'abord un lien."}


# ─── 7. CRON JOB — AUTOMATIC PROCESSING ───
@router.post("/process-cron")
async def process_cron():
    """
    Automatic payment processing cron job.
    Should be called periodically (every 15 minutes).
    
    Actions:
    1. Auto-send links for flexible reservations when deadline approaches
    2. Auto-cancel if not paid within 24h of link sent
    3. Auto-send link immediately for non-refundable
    4. Convert pre-auth to payment at deadline
    """
    now = datetime.now(timezone.utc)
    results = {"processed": 0, "links_sent": 0, "cancelled": 0, "captured": 0, "errors": []}

    try:
        # 1. Non-refundable: send link immediately if not sent
        nr_reservations = await supa("GET", "reservations",
            params="rate_type=eq.non_refundable&payment_status=eq.pending&payment_link_sent=is.false&status=in.(confirmed,pending)&select=*")

        if isinstance(nr_reservations, list):
            for res in nr_reservations:
                try:
                    from routes.payments import create_payment_link, PaymentLinkCreate
                    link = PaymentLinkCreate(
                        hotel_id=res["hotel_id"],
                        provider="stripe",
                        reservation_id=res["id"],
                        amount=float(res.get("total_amount", 0)),
                        currency="EUR",
                        guest_email=res.get("client_email", ""),
                        guest_name=res.get("client_name", ""),
                        description=f"Reservation non remboursable — Ch. {res.get('room_number', '')}",
                    )
                    result = await create_payment_link(link)
                    if result.get("success"):
                        deadline = (now + timedelta(hours=24)).isoformat()
                        await update_reservation(res["id"], {
                            "payment_status": "link_sent",
                            "payment_link_sent": True,
                            "payment_deadline": deadline,
                        })
                        results["links_sent"] += 1
                except Exception as e:
                    results["errors"].append(f"NR link {res['id']}: {e}")

        # 2. Flexible: check if deadline is approaching and send link
        flex_reservations = await supa("GET", "reservations",
            params="payment_status=eq.pending&payment_link_sent=is.false&status=in.(confirmed,pending)&rate_type=neq.non_refundable&select=*")

        if isinstance(flex_reservations, list):
            for res in flex_reservations:
                try:
                    check_in_str = res.get("check_in", "")
                    if not check_in_str:
                        continue

                    check_in_dt = datetime.fromisoformat(check_in_str.replace("Z", "+00:00"))
                    if check_in_dt.tzinfo is None:
                        check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)

                    rate_type = res.get("rate_type", "standard")
                    deadline_hours = POLICY_DEADLINES.get(rate_type, 48)
                    deadline_dt = check_in_dt - timedelta(hours=deadline_hours)

                    # Send link 1 minute before deadline
                    if now >= deadline_dt - timedelta(minutes=1):
                        from routes.payments import create_payment_link, PaymentLinkCreate
                        link = PaymentLinkCreate(
                            hotel_id=res["hotel_id"],
                            provider="stripe",
                            reservation_id=res["id"],
                            amount=float(res.get("balance", res.get("total_amount", 0))),
                            currency="EUR",
                            guest_email=res.get("client_email", ""),
                            guest_name=res.get("client_name", ""),
                            description=f"Paiement reservation Ch. {res.get('room_number', '')}",
                        )
                        result = await create_payment_link(link)
                        if result.get("success"):
                            cancel_deadline = (now + timedelta(hours=24)).isoformat()
                            await update_reservation(res["id"], {
                                "payment_status": "link_sent",
                                "payment_link_sent": True,
                                "payment_deadline": cancel_deadline,
                            })
                            results["links_sent"] += 1
                except Exception as e:
                    results["errors"].append(f"Flex link {res.get('id', '?')}: {e}")

        # 3. Auto-cancel if link sent > 24h ago and not paid
        link_sent_reservations = await supa("GET", "reservations",
            params="payment_status=eq.link_sent&status=in.(confirmed,pending)&select=*")

        if isinstance(link_sent_reservations, list):
            for res in link_sent_reservations:
                try:
                    deadline_str = res.get("payment_deadline")
                    if not deadline_str:
                        continue

                    deadline_dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
                    if deadline_dt.tzinfo is None:
                        deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)

                    if now > deadline_dt:
                        await update_reservation(res["id"], {
                            "status": "cancelled",
                            "payment_status": "cancelled",
                        })
                        results["cancelled"] += 1
                except Exception as e:
                    results["errors"].append(f"Cancel {res.get('id', '?')}: {e}")

        # 4. Auto-capture pre-auth at deadline
        preauth_reservations = await supa("GET", "reservations",
            params="payment_status=eq.preauthorized&preauthorization_status=eq.pending&select=*")

        if isinstance(preauth_reservations, list):
            for res in preauth_reservations:
                try:
                    check_in_str = res.get("check_in", "")
                    if not check_in_str:
                        continue

                    check_in_dt = datetime.fromisoformat(check_in_str.replace("Z", "+00:00"))
                    if check_in_dt.tzinfo is None:
                        check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)

                    rate_type = res.get("rate_type", "standard")
                    deadline_hours = POLICY_DEADLINES.get(rate_type, 48)
                    deadline_dt = check_in_dt - timedelta(hours=deadline_hours)

                    if now >= deadline_dt:
                        preauth_id = res.get("preauthorization_id")
                        if preauth_id:
                            intent = stripe.PaymentIntent.capture(preauth_id)
                            captured = intent.amount_received / 100.0
                            new_paid = res.get("paid_amount", 0) + captured
                            new_balance = res.get("total_amount", 0) - new_paid

                            await update_reservation(res["id"], {
                                "payment_status": "paid" if new_balance <= 0 else "partial_paid",
                                "paid_amount": new_paid,
                                "balance": new_balance,
                                "preauthorization_status": "captured",
                            })
                            results["captured"] += 1
                except Exception as e:
                    results["errors"].append(f"Capture {res.get('id', '?')}: {e}")

        results["processed"] = results["links_sent"] + results["cancelled"] + results["captured"]
    except Exception as e:
        results["errors"].append(str(e))

    logger.info(f"Cron results: {results}")
    return results
