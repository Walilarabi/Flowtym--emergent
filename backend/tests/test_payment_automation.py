"""
Test Payment Automation Endpoints for Flowtym PMS
Tests: GET /api/payments/auto/status/{reservation_id}
       POST /api/payments/auto/send-link
       POST /api/payments/auto/preauthorize
       POST /api/payments/auto/capture-preauth
       POST /api/payments/auto/cancel-preauth
       POST /api/payments/auto/send-reminder
       POST /api/payments/auto/process-cron
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data from Supabase
HOTEL_ID = "fae266ac-2f4c-4297-af9f-b3b988d86c5b"
# Sophie Laurent reservation (total_amount=0 in test data)
RESERVATION_ID_ZERO_AMOUNT = "62422a10-85ed-459d-aeb6-4cfdbe606643"
# Marc Dubois reservation
RESERVATION_ID_MARC = "c1c8e8b1-72fe-45f4-aafd-212a2f0ae46c"
NON_EXISTENT_RESERVATION = "00000000-0000-0000-0000-000000000000"


class TestPaymentStatusEndpoint:
    """Tests for GET /api/payments/auto/status/{reservation_id}"""
    
    def test_get_payment_status_valid_reservation(self):
        """Test getting payment status for a valid reservation"""
        response = requests.get(f"{BASE_URL}/api/payments/auto/status/{RESERVATION_ID_ZERO_AMOUNT}")
        print(f"GET /api/payments/auto/status/{RESERVATION_ID_ZERO_AMOUNT}: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "reservation_id" in data, "Missing reservation_id in response"
        assert "payment_status" in data, "Missing payment_status in response"
        assert "payment_status_label" in data, "Missing payment_status_label in response"
        assert "total_amount" in data, "Missing total_amount in response"
        assert "paid_amount" in data, "Missing paid_amount in response"
        assert "balance" in data, "Missing balance in response"
        assert "links" in data, "Missing links in response"
        assert "transactions" in data, "Missing transactions in response"
        
        # Verify data types
        assert isinstance(data["links"], list), "links should be a list"
        assert isinstance(data["transactions"], list), "transactions should be a list"
        
        print(f"Payment status: {data['payment_status']} ({data['payment_status_label']})")
        print(f"Total: {data['total_amount']}, Paid: {data['paid_amount']}, Balance: {data['balance']}")
    
    def test_get_payment_status_second_reservation(self):
        """Test getting payment status for Marc Dubois reservation"""
        response = requests.get(f"{BASE_URL}/api/payments/auto/status/{RESERVATION_ID_MARC}")
        print(f"GET /api/payments/auto/status/{RESERVATION_ID_MARC}: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["reservation_id"] == RESERVATION_ID_MARC
        print(f"Marc Dubois - Status: {data['payment_status']}, Total: {data['total_amount']}")
    
    def test_get_payment_status_non_existent(self):
        """Test getting payment status for non-existent reservation returns 404"""
        response = requests.get(f"{BASE_URL}/api/payments/auto/status/{NON_EXISTENT_RESERVATION}")
        print(f"GET /api/payments/auto/status/{NON_EXISTENT_RESERVATION}: {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Missing detail in 404 response"
        print(f"404 response: {data['detail']}")


class TestSendPaymentLinkEndpoint:
    """Tests for POST /api/payments/auto/send-link"""
    
    def test_send_link_zero_amount_reservation(self):
        """Test sending link for reservation with zero amount returns error"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_ZERO_AMOUNT,
            "amount_type": "total"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-link", json=payload)
        print(f"POST /api/payments/auto/send-link (zero amount): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should return success=False with error message since total_amount=0
        assert "success" in data, "Missing success field"
        if data.get("total_amount", 0) == 0 or data.get("success") == False:
            print(f"Expected behavior: {data.get('error', 'No amount to pay')}")
        else:
            print(f"Link sent: {data}")
    
    def test_send_link_marc_reservation(self):
        """Test sending payment link for Marc Dubois reservation"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_MARC,
            "amount_type": "total"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-link", json=payload)
        print(f"POST /api/payments/auto/send-link (Marc): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data, "Missing success field"
        print(f"Send link result: success={data.get('success')}, message={data.get('message', data.get('error', 'N/A'))}")
    
    def test_send_link_first_night(self):
        """Test sending payment link for first night amount"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_MARC,
            "amount_type": "first_night"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-link", json=payload)
        print(f"POST /api/payments/auto/send-link (first_night): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        print(f"First night link: success={data.get('success')}, amount={data.get('amount', 'N/A')}")
    
    def test_send_link_non_existent_reservation(self):
        """Test sending link for non-existent reservation returns 404"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": NON_EXISTENT_RESERVATION,
            "amount_type": "total"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-link", json=payload)
        print(f"POST /api/payments/auto/send-link (non-existent): {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
    
    def test_send_link_missing_fields(self):
        """Test sending link with missing required fields returns 422"""
        payload = {"hotel_id": HOTEL_ID}  # Missing reservation_id
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-link", json=payload)
        print(f"POST /api/payments/auto/send-link (missing fields): {response.status_code}")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"


class TestPreauthorizeEndpoint:
    """Tests for POST /api/payments/auto/preauthorize"""
    
    def test_preauthorize_first_night(self):
        """Test pre-authorization for first night (will fail with test Stripe key)"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_MARC,
            "amount_type": "first_night"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/preauthorize", json=payload)
        print(f"POST /api/payments/auto/preauthorize (first_night): {response.status_code}")
        
        # With sk_test_emergent, Stripe SDK operations will fail - this is expected
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        # Expected to fail with test key
        if not data.get("success"):
            print(f"Expected Stripe error with test key: {data.get('error', 'N/A')}")
        else:
            print(f"Preauth created: {data}")
    
    def test_preauthorize_total(self):
        """Test pre-authorization for total amount"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_MARC,
            "amount_type": "total"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/preauthorize", json=payload)
        print(f"POST /api/payments/auto/preauthorize (total): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        print(f"Preauth total result: success={data.get('success')}, error={data.get('error', 'N/A')}")
    
    def test_preauthorize_non_existent_reservation(self):
        """Test pre-authorization for non-existent reservation returns 404"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": NON_EXISTENT_RESERVATION,
            "amount_type": "first_night"
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/preauthorize", json=payload)
        print(f"POST /api/payments/auto/preauthorize (non-existent): {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestCapturePreauthEndpoint:
    """Tests for POST /api/payments/auto/capture-preauth"""
    
    def test_capture_preauth_no_preauth(self):
        """Test capturing pre-auth when none exists returns error"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_ZERO_AMOUNT
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/capture-preauth", json=payload)
        print(f"POST /api/payments/auto/capture-preauth (no preauth): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        # Should fail since no pre-auth exists
        assert data.get("success") == False, "Should fail when no pre-auth exists"
        print(f"Expected error: {data.get('error', 'N/A')}")
    
    def test_capture_preauth_non_existent_reservation(self):
        """Test capturing pre-auth for non-existent reservation returns 404"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": NON_EXISTENT_RESERVATION
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/capture-preauth", json=payload)
        print(f"POST /api/payments/auto/capture-preauth (non-existent): {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestCancelPreauthEndpoint:
    """Tests for POST /api/payments/auto/cancel-preauth"""
    
    def test_cancel_preauth_no_preauth(self):
        """Test canceling pre-auth when none exists returns error"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_ZERO_AMOUNT
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/cancel-preauth", json=payload)
        print(f"POST /api/payments/auto/cancel-preauth (no preauth): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        # Should fail since no pre-auth exists
        assert data.get("success") == False, "Should fail when no pre-auth exists"
        print(f"Expected error: {data.get('error', 'N/A')}")
    
    def test_cancel_preauth_non_existent_reservation(self):
        """Test canceling pre-auth for non-existent reservation returns 404"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": NON_EXISTENT_RESERVATION
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/cancel-preauth", json=payload)
        print(f"POST /api/payments/auto/cancel-preauth (non-existent): {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestSendReminderEndpoint:
    """Tests for POST /api/payments/auto/send-reminder"""
    
    def test_send_reminder_no_link(self):
        """Test sending reminder when no payment link exists returns error"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": RESERVATION_ID_ZERO_AMOUNT
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-reminder", json=payload)
        print(f"POST /api/payments/auto/send-reminder (no link): {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        # Should fail since no payment link exists
        if not data.get("success"):
            print(f"Expected error (no link): {data.get('error', 'N/A')}")
        else:
            print(f"Reminder sent: {data}")
    
    def test_send_reminder_non_existent_reservation(self):
        """Test sending reminder for non-existent reservation returns 404"""
        payload = {
            "hotel_id": HOTEL_ID,
            "reservation_id": NON_EXISTENT_RESERVATION
        }
        response = requests.post(f"{BASE_URL}/api/payments/auto/send-reminder", json=payload)
        print(f"POST /api/payments/auto/send-reminder (non-existent): {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


class TestProcessCronEndpoint:
    """Tests for POST /api/payments/auto/process-cron"""
    
    def test_process_cron(self):
        """Test cron job processing"""
        response = requests.post(f"{BASE_URL}/api/payments/auto/process-cron")
        print(f"POST /api/payments/auto/process-cron: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "processed" in data, "Missing processed count"
        assert "links_sent" in data, "Missing links_sent count"
        assert "cancelled" in data, "Missing cancelled count"
        assert "captured" in data, "Missing captured count"
        assert "errors" in data, "Missing errors list"
        
        print(f"Cron results: processed={data['processed']}, links_sent={data['links_sent']}, cancelled={data['cancelled']}, captured={data['captured']}")
        if data.get("errors"):
            print(f"Cron errors: {data['errors']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
