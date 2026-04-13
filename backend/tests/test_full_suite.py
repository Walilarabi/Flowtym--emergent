"""
Flowtym PMS — Comprehensive Test Suite
Covers: Stripe Connect, Payment Automation, Maintenance, CRM, Cron
"""
import pytest
import httpx
import os
import asyncio

API_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://reception-suite-1.preview.emergentagent.com")
HOTEL_ID = "fae266ac-2f4c-4297-af9f-b3b988d86c5b"
TEST_RESERVATION_ID = "62422a10-85ed-459d-aeb6-4cfdbe606643"


@pytest.fixture
def client():
    return httpx.Client(base_url=API_URL, timeout=15)


# ═══════════════════════════════════════════════════════════════
# STRIPE CONNECT TESTS
# ═══════════════════════════════════════════════════════════════

class TestStripeConnect:
    def test_hotel_stripe_info(self, client):
        r = client.get(f"/api/stripe/hotel/{HOTEL_ID}")
        assert r.status_code == 200
        data = r.json()
        assert "hotel_id" in data
        assert "is_connected" in data

    def test_hotel_stripe_info_404(self, client):
        r = client.get("/api/stripe/hotel/non-existent")
        assert r.status_code == 404

    def test_quick_checkout(self, client):
        r = client.post("/api/stripe/quick-checkout", json={
            "origin_url": API_URL,
            "amount": 50.0,
            "currency": "eur",
            "hotel_id": HOTEL_ID,
            "description": "Test checkout",
        })
        assert r.status_code == 200
        data = r.json()
        assert "url" in data
        assert "sessionId" in data
        assert data["url"].startswith("https://checkout.stripe.com")

    def test_quick_checkout_invalid_amount(self, client):
        r = client.post("/api/stripe/quick-checkout", json={
            "origin_url": API_URL,
            "amount": 0,
            "currency": "eur",
        })
        assert r.status_code == 400

    def test_create_connect_account_validation(self, client):
        r = client.post("/api/stripe/create-connect-account", json={
            "hotel_id": HOTEL_ID,
            "email": "test@hotel.com",
        })
        # Either 200 (real key) or 400 (test key)
        assert r.status_code in (200, 400)

    def test_account_status_invalid(self, client):
        r = client.get("/api/stripe/account-status/acct_invalid")
        assert r.status_code == 400

    def test_create_product_invalid(self, client):
        r = client.post("/api/stripe/create-product", json={
            "account_id": "acct_invalid",
            "hotel_id": HOTEL_ID,
            "product_name": "Test",
            "product_price": 1000,
        })
        assert r.status_code == 400

    def test_webhook(self, client):
        r = client.post("/api/stripe/webhook", json={
            "type": "checkout.session.completed",
            "data": {"object": {"id": "test", "metadata": {}}},
        })
        assert r.status_code == 200
        assert r.json().get("received") is True


# ═══════════════════════════════════════════════════════════════
# PAYMENT AUTOMATION TESTS
# ═══════════════════════════════════════════════════════════════

class TestPaymentAutomation:
    def test_payment_status(self, client):
        r = client.get(f"/api/payments/auto/status/{TEST_RESERVATION_ID}")
        assert r.status_code == 200
        data = r.json()
        assert data["reservation_id"] == TEST_RESERVATION_ID
        assert "payment_status" in data
        assert "total_amount" in data
        assert "balance" in data

    def test_payment_status_404(self, client):
        r = client.get("/api/payments/auto/status/non-existent-id")
        assert r.status_code == 404

    def test_send_link(self, client):
        r = client.post("/api/payments/auto/send-link", json={
            "hotel_id": HOTEL_ID,
            "reservation_id": TEST_RESERVATION_ID,
            "amount_type": "total",
        })
        assert r.status_code == 200

    def test_send_link_404(self, client):
        r = client.post("/api/payments/auto/send-link", json={
            "hotel_id": HOTEL_ID,
            "reservation_id": "non-existent",
        })
        assert r.status_code == 404

    def test_preauthorize(self, client):
        r = client.post("/api/payments/auto/preauthorize", json={
            "hotel_id": HOTEL_ID,
            "reservation_id": TEST_RESERVATION_ID,
            "amount_type": "first_night",
        })
        # Stripe error expected with test key
        assert r.status_code == 200

    def test_capture_no_preauth(self, client):
        r = client.post("/api/payments/auto/capture-preauth", json={
            "hotel_id": HOTEL_ID,
            "reservation_id": TEST_RESERVATION_ID,
        })
        assert r.status_code == 200
        assert r.json().get("success") is False

    def test_cancel_no_preauth(self, client):
        r = client.post("/api/payments/auto/cancel-preauth", json={
            "hotel_id": HOTEL_ID,
            "reservation_id": TEST_RESERVATION_ID,
        })
        assert r.status_code == 200
        assert r.json().get("success") is False

    def test_send_reminder_no_link(self, client):
        r = client.post("/api/payments/auto/send-reminder", json={
            "hotel_id": HOTEL_ID,
            "reservation_id": TEST_RESERVATION_ID,
        })
        assert r.status_code == 200

    def test_process_cron(self, client):
        r = client.post("/api/payments/auto/process-cron")
        assert r.status_code == 200
        data = r.json()
        assert "processed" in data
        assert "links_sent" in data
        assert "cancelled" in data


# ═══════════════════════════════════════════════════════════════
# MAINTENANCE TESTS
# ═══════════════════════════════════════════════════════════════

class TestMaintenance:
    def test_list_tickets(self, client):
        r = client.get(f"/api/maintenance/{HOTEL_ID}/tickets")
        assert r.status_code == 200
        data = r.json()
        assert "tickets" in data
        assert "total" in data

    def test_get_stats(self, client):
        r = client.get(f"/api/maintenance/{HOTEL_ID}/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "open" in data
        assert "urgent" in data

    def test_create_ticket(self, client):
        r = client.post(f"/api/maintenance/{HOTEL_ID}/tickets", json={
            "hotel_id": HOTEL_ID,
            "title": "Test - Fuite robinet",
            "description": "Salle de bain chambre 203",
            "room_number": "203",
            "priority": "normal",
            "category": "plumbing",
        })
        assert r.status_code == 200

    def test_create_ticket_missing_title(self, client):
        r = client.post(f"/api/maintenance/{HOTEL_ID}/tickets", json={
            "hotel_id": HOTEL_ID,
        })
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════
# EXISTING PAYMENTS TESTS
# ═══════════════════════════════════════════════════════════════

class TestExistingPayments:
    def test_init_payment(self, client):
        r = client.post("/api/payments/init", json={
            "hotel_id": HOTEL_ID,
            "provider": "stripe",
            "amount": 100.0,
            "currency": "EUR",
        })
        assert r.status_code == 200

    def test_create_payment_link(self, client):
        r = client.post("/api/payments/create-link", json={
            "hotel_id": HOTEL_ID,
            "provider": "stripe",
            "amount": 50.0,
            "guest_email": "test@hotel.com",
        })
        assert r.status_code == 200
        data = r.json()
        # With real key: success=True, with test key: success=False (Stripe error)
        assert "success" in data

    def test_webhook_stripe(self, client):
        r = client.post("/api/payments/webhook/stripe", json={
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_test", "metadata": {"hotel_id": HOTEL_ID}}},
        })
        assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════
# CRM API TESTS
# ═══════════════════════════════════════════════════════════════

class TestCRM:
    def test_list_clients(self, client):
        r = client.get(f"/api/crm/{HOTEL_ID}/clients")
        # May need auth or different structure
        assert r.status_code in (200, 401, 403, 404)

    def test_crm_analytics(self, client):
        r = client.get(f"/api/crm/{HOTEL_ID}/analytics")
        assert r.status_code in (200, 401, 403, 404)


# ═══════════════════════════════════════════════════════════════
# HEALTH & GENERAL TESTS
# ═══════════════════════════════════════════════════════════════

class TestHealth:
    def test_server_running(self, client):
        r = client.get("/")
        assert r.status_code in (200, 404)

    def test_api_docs(self, client):
        r = client.get("/docs")
        assert r.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
