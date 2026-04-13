"""
Flowtym PMS — Stripe Connect Routes
Marketplace model: each hotel = connected account on Stripe.
Hotels create products, customers pay via Stripe Checkout.
"""
import os
import logging
import stripe
import httpx
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stripe", tags=["Stripe Connect"])

# ─── ENV ───
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPA_HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

stripe.api_key = STRIPE_API_KEY


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


# ─── REQUEST MODELS ───
class CreateConnectAccountRequest(BaseModel):
    hotel_id: str
    email: str
    business_name: Optional[str] = None
    country: str = "FR"

class CreateAccountLinkRequest(BaseModel):
    account_id: str
    hotel_id: Optional[str] = None

class CreateProductRequest(BaseModel):
    account_id: str
    hotel_id: str
    product_name: str
    product_description: Optional[str] = ""
    product_price: int  # in cents
    currency: str = "eur"

class CreateCheckoutRequest(BaseModel):
    account_id: str
    price_id: str
    hotel_id: Optional[str] = None
    origin_url: str
    reservation_id: Optional[str] = None
    guest_email: Optional[str] = None


# ─── 1. CREATE CONNECT ACCOUNT ───
@router.post("/create-connect-account")
async def create_connect_account(req: CreateConnectAccountRequest):
    """Create a Stripe Connect account for a hotel"""
    try:
        # Check if hotel already has a Stripe account
        existing = await supa("GET", "hotels", params=f"id=eq.{req.hotel_id}&select=stripe_account_id")
        if existing and isinstance(existing, list) and len(existing) > 0:
            existing_id = existing[0].get("stripe_account_id")
            if existing_id:
                return {"accountId": existing_id, "message": "Compte Connect existant"}

        account = stripe.Account.create(
            type="express",
            country=req.country,
            email=req.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="company",
            business_profile={
                "mcc": "7011",  # Hotels & Motels
                "name": req.business_name or "Hotel Flowtym",
            },
        )

        # Save to hotels table
        await supa("PATCH", "hotels", {"stripe_account_id": account.id}, params=f"id=eq.{req.hotel_id}")

        # Save to stripe_accounts table
        await supa("POST", "stripe_accounts", {
            "hotel_id": req.hotel_id,
            "stripe_account_id": account.id,
            "email": req.email,
            "country": req.country,
            "status": "pending",
        })

        return {"accountId": account.id}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe Connect create error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message or e))
    except Exception as e:
        logger.error(f"Connect account error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. CREATE ACCOUNT LINK (ONBOARDING) ───
@router.post("/create-account-link")
async def create_account_link(req: CreateAccountLinkRequest):
    """Create an onboarding link for a Stripe Connect account"""
    try:
        account_link = stripe.AccountLink.create(
            account=req.account_id,
            refresh_url=f"{os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', ''))}/finance/stripe?refresh=true",
            return_url=f"{os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', ''))}/finance/stripe?accountId={req.account_id}",
            type="account_onboarding",
        )
        return {"url": account_link.url}

    except stripe.error.StripeError as e:
        logger.error(f"Account link error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message or e))


# ─── 3. ACCOUNT STATUS ───
@router.get("/account-status/{account_id}")
async def get_account_status(account_id: str):
    """Get the status of a Stripe Connect account"""
    try:
        account = stripe.Account.retrieve(account_id)
        return {
            "id": account.id,
            "chargesEnabled": account.charges_enabled,
            "payoutsEnabled": account.payouts_enabled,
            "detailsSubmitted": account.details_submitted,
            "email": account.email,
            "country": account.country,
            "requirements": {
                "currently_due": account.requirements.currently_due if account.requirements else [],
                "eventually_due": account.requirements.eventually_due if account.requirements else [],
                "errors": [e.reason for e in (account.requirements.errors or [])] if account.requirements else [],
            },
        }

    except stripe.error.StripeError as e:
        logger.error(f"Account status error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message or e))


# ─── 4. CREATE PRODUCT ───
@router.post("/create-product")
async def create_product(req: CreateProductRequest):
    """Create a product on a connected account"""
    try:
        product = stripe.Product.create(
            name=req.product_name,
            description=req.product_description or "",
            stripe_account=req.account_id,
        )

        price = stripe.Price.create(
            product=product.id,
            unit_amount=req.product_price,
            currency=req.currency,
            stripe_account=req.account_id,
        )

        # Save to stripe_products table
        await supa("POST", "stripe_products", {
            "hotel_id": req.hotel_id,
            "stripe_product_id": product.id,
            "stripe_price_id": price.id,
            "name": req.product_name,
            "description": req.product_description or "",
            "price_cents": req.product_price,
            "currency": req.currency,
        })

        return {
            "productId": product.id,
            "priceId": price.id,
            "productName": req.product_name,
            "productPrice": req.product_price,
        }

    except stripe.error.StripeError as e:
        logger.error(f"Create product error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message or e))


# ─── 5. LIST PRODUCTS ───
@router.get("/products/{account_id}")
async def list_products(account_id: str):
    """List products for a connected account"""
    try:
        prices = stripe.Price.list(
            active=True,
            limit=100,
            expand=["data.product"],
            stripe_account=account_id,
        )

        products = []
        for price in prices.data:
            prod = price.product
            products.append({
                "id": prod.id if hasattr(prod, 'id') else str(prod),
                "name": prod.name if hasattr(prod, 'name') else "Produit",
                "description": prod.description if hasattr(prod, 'description') else "",
                "price": price.unit_amount,
                "priceId": price.id,
                "currency": price.currency,
            })

        return products

    except stripe.error.StripeError as e:
        logger.error(f"List products error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message or e))


# ─── 6. CREATE CHECKOUT SESSION ───
@router.post("/create-checkout-session")
async def create_checkout_session(req: CreateCheckoutRequest, http_request: Request):
    """Create a Stripe Checkout session on a connected account"""
    try:
        # Get price details to determine mode
        price = stripe.Price.retrieve(req.price_id, stripe_account=req.account_id)
        mode = "subscription" if price.type == "recurring" else "payment"

        origin = req.origin_url.rstrip("/")
        success_url = f"{origin}/finance/stripe/done?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/finance/stripe"

        session = stripe.checkout.Session.create(
            line_items=[{"price": req.price_id, "quantity": 1}],
            mode=mode,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "hotel_id": req.hotel_id or "",
                "reservation_id": req.reservation_id or "",
                "guest_email": req.guest_email or "",
            },
            stripe_account=req.account_id,
        )

        # Log transaction in payment_transactions
        await supa("POST", "payment_transactions", {
            "hotel_id": req.hotel_id,
            "reservation_id": req.reservation_id,
            "provider": "stripe_connect",
            "transaction_id": session.id,
            "amount": price.unit_amount / 100.0,
            "currency": price.currency.upper(),
            "status": "pending",
        })

        return {"url": session.url, "sessionId": session.id}

    except stripe.error.StripeError as e:
        logger.error(f"Checkout session error: {e}")
        raise HTTPException(status_code=400, detail=str(e.user_message or e))


# ─── 6b. QUICK CHECKOUT (no connected account — uses emergentintegrations) ───
@router.post("/quick-checkout")
async def quick_checkout(http_request: Request):
    """Create a simple checkout session (no connected account required)"""
    try:
        body = await http_request.json()
        origin_url = body.get("origin_url", "").rstrip("/")
        amount = float(body.get("amount", 0))
        currency = body.get("currency", "eur")
        hotel_id = body.get("hotel_id", "")
        reservation_id = body.get("reservation_id", "")
        description = body.get("description", "Paiement Hotel")

        if amount <= 0:
            raise HTTPException(status_code=400, detail="Montant invalide")

        success_url = f"{origin_url}/finance/stripe/done?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/finance/stripe"

        webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/stripe/webhook"
        checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

        checkout_req = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "hotel_id": hotel_id,
                "reservation_id": reservation_id,
                "description": description,
            },
        )

        session: CheckoutSessionResponse = await checkout.create_checkout_session(checkout_req)

        # Log transaction
        await supa("POST", "payment_transactions", {
            "hotel_id": hotel_id or None,
            "reservation_id": reservation_id or None,
            "provider": "stripe",
            "transaction_id": session.session_id,
            "amount": amount,
            "currency": currency.upper(),
            "status": "pending",
        })

        return {"url": session.url, "sessionId": session.session_id}

    except HTTPException:
        raise  # Re-raise HTTPException as-is (preserves 400 status)
    except Exception as e:
        logger.error(f"Quick checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 7. CHECKOUT STATUS ───
@router.get("/checkout-status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    """Poll checkout session status"""
    try:
        webhook_url = f"{str(http_request.base_url).rstrip('/')}/api/stripe/webhook"
        checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        status: CheckoutStatusResponse = await checkout.get_checkout_status(session_id)

        # Update payment_transactions
        new_status = "succeeded" if status.payment_status == "paid" else status.status
        await supa(
            "PATCH", "payment_transactions",
            {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()},
            params=f"transaction_id=eq.{session_id}",
        )

        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata,
        }

    except Exception as e:
        logger.error(f"Checkout status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 8. WEBHOOK ───
@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        # Try emergentintegrations handler first
        checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await checkout.handle_webhook(body, sig)

        event_type = webhook_response.event_type if hasattr(webhook_response, "event_type") else "unknown"
        session_id = webhook_response.session_id if hasattr(webhook_response, "session_id") else ""
        payment_status = webhook_response.payment_status if hasattr(webhook_response, "payment_status") else ""

        logger.info(f"Webhook: {event_type} | session={session_id} | payment={payment_status}")

        # Update transaction if we have a session_id
        if session_id and payment_status:
            new_status = "succeeded" if payment_status == "paid" else payment_status
            await supa(
                "PATCH", "payment_transactions",
                {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()},
                params=f"transaction_id=eq.{session_id}",
            )

        # Log webhook
        await supa("POST", "payment_webhooks", {
            "provider": "stripe",
            "event_type": event_type,
            "payload": {"session_id": session_id, "payment_status": payment_status},
            "processed": True,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        })

        return {"received": True}

    except Exception as e:
        # Fallback: try raw JSON parsing
        try:
            payload_json = await request.json()
            event_type = payload_json.get("type", "")
            data_obj = payload_json.get("data", {}).get("object", {})

            await supa("POST", "payment_webhooks", {
                "provider": "stripe",
                "event_type": event_type,
                "payload": payload_json,
                "processed": True,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            })

            if event_type == "checkout.session.completed":
                sid = data_obj.get("id", "")
                if sid:
                    await supa(
                        "PATCH", "payment_transactions",
                        {"status": "succeeded", "updated_at": datetime.now(timezone.utc).isoformat()},
                        params=f"transaction_id=eq.{sid}",
                    )

            return {"received": True}
        except Exception as inner_e:
            logger.error(f"Webhook error: {inner_e}")
            return {"received": True, "error": str(inner_e)}


# ─── 9. LIST HOTEL STRIPE INFO ───
@router.get("/hotel/{hotel_id}")
async def get_hotel_stripe_info(hotel_id: str):
    """Get Stripe Connect info for a hotel"""
    hotels = await supa("GET", "hotels", params=f"id=eq.{hotel_id}&select=id,name,stripe_account_id")
    if not hotels or (isinstance(hotels, list) and len(hotels) == 0):
        # Fallback: try without stripe_account_id column (SQL not yet run)
        hotels = await supa("GET", "hotels", params=f"id=eq.{hotel_id}&select=id,name")
        if not hotels or (isinstance(hotels, list) and len(hotels) == 0):
            raise HTTPException(status_code=404, detail="Hotel non trouvé")
        hotel = hotels[0] if isinstance(hotels, list) else hotels
        return {
            "hotel_id": hotel_id,
            "hotel_name": hotel.get("name", ""),
            "stripe_account_id": None,
            "is_connected": False,
            "account_status": None,
            "sql_needed": True,
        }

    hotel = hotels[0] if isinstance(hotels, list) else hotels
    account_id = hotel.get("stripe_account_id")

    result = {
        "hotel_id": hotel_id,
        "hotel_name": hotel.get("name", ""),
        "stripe_account_id": account_id,
        "is_connected": bool(account_id),
        "account_status": None,
    }

    if account_id:
        try:
            account = stripe.Account.retrieve(account_id)
            result["account_status"] = {
                "chargesEnabled": account.charges_enabled,
                "payoutsEnabled": account.payouts_enabled,
                "detailsSubmitted": account.details_submitted,
            }
        except Exception:
            result["account_status"] = {"error": "Impossible de récupérer le statut"}

    return result
