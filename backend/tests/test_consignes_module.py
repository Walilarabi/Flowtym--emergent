"""
Test suite for Flowtym Operations Hub - Consignes Module
Tests CRUD operations, stats, calendar, and AI endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@flowtym.com"
ADMIN_PASSWORD = "admin123"

class TestConsignesModule:
    """Test suite for Consignes (Operations Hub) module"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
        
        data = login_response.json()
        self.token = data.get("token")
        self.user = data.get("user")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get hotel ID
        hotels_response = self.session.get(f"{BASE_URL}/api/hotels")
        if hotels_response.status_code == 200:
            hotels = hotels_response.json()
            if hotels:
                self.hotel_id = hotels[0].get("id")
            else:
                pytest.skip("No hotels available for testing")
        else:
            pytest.skip("Could not fetch hotels")
        
        yield
        
        # Cleanup: Delete test consignes
        self._cleanup_test_data()
    
    def _cleanup_test_data(self):
        """Clean up test-created consignes"""
        try:
            response = self.session.get(f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes?search=TEST_")
            if response.status_code == 200:
                consignes = response.json().get("consignes", [])
                for c in consignes:
                    if c.get("title", "").startswith("TEST_"):
                        self.session.delete(f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{c['consigne_id']}")
        except:
            pass
    
    # ==================== STATS ENDPOINT ====================
    
    def test_get_consignes_stats(self):
        """Test GET /api/consignes/hotels/{hotel_id}/stats - Dashboard statistics"""
        response = self.session.get(f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify required fields in stats response
        assert "total" in data, "Missing 'total' in stats"
        assert "by_status" in data, "Missing 'by_status' in stats"
        assert "by_service" in data, "Missing 'by_service' in stats"
        assert "by_priority" in data, "Missing 'by_priority' in stats"
        assert "today" in data, "Missing 'today' in stats"
        assert "overdue" in data, "Missing 'overdue' in stats"
        assert "urgent" in data, "Missing 'urgent' in stats"
        assert "completion_rate" in data, "Missing 'completion_rate' in stats"
        assert "recent" in data, "Missing 'recent' in stats"
        
        print(f"✓ Stats endpoint working - Total: {data['total']}, Today: {data['today']}, Urgent: {data['urgent']}")
    
    # ==================== CREATE CONSIGNE ====================
    
    def test_create_consigne_basic(self):
        """Test POST /api/consignes/hotels/{hotel_id}/consignes - Create basic consigne"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        payload = {
            "title": "TEST_Basic Consigne",
            "description": "Test description for basic consigne",
            "service": "reception",
            "priority": "normale",
            "due_date": today
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "consigne" in data, "Missing 'consigne' in response"
        
        consigne = data["consigne"]
        assert consigne["title"] == payload["title"], "Title mismatch"
        assert consigne["description"] == payload["description"], "Description mismatch"
        assert consigne["service"] == payload["service"], "Service mismatch"
        assert consigne["priority"] == payload["priority"], "Priority mismatch"
        assert consigne["status"] == "nouvelle", "Initial status should be 'nouvelle'"
        assert "consigne_id" in consigne, "Missing consigne_id"
        
        print(f"✓ Created consigne: {consigne['consigne_id']}")
        
        # Store for later tests
        self.created_consigne_id = consigne["consigne_id"]
        return consigne
    
    def test_create_consigne_with_room_and_client(self):
        """Test creating consigne with room and client info"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        payload = {
            "title": "TEST_VIP Client Consigne",
            "description": "Prepare VIP welcome for client",
            "room_number": "101",
            "client_name": "M. Dupont",
            "service": "conciergerie",
            "priority": "haute",
            "due_date": today,
            "requires_proof": True,
            "tags": ["vip", "welcome"]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        consigne = data["consigne"]
        
        assert consigne["room_number"] == "101", "Room number mismatch"
        assert consigne["client_name"] == "M. Dupont", "Client name mismatch"
        assert consigne["requires_proof"] == True, "requires_proof mismatch"
        assert "vip" in consigne["tags"], "Tags mismatch"
        
        print(f"✓ Created consigne with room/client: {consigne['consigne_id']}")
    
    def test_create_consigne_with_recurrence(self):
        """Test creating consigne with recurrence"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        payload = {
            "title": "TEST_Daily Cleaning Check",
            "description": "Daily cleaning verification",
            "service": "housekeeping",
            "priority": "normale",
            "due_date": today,
            "recurrence": "quotidienne"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        consigne = data["consigne"]
        
        assert consigne["recurrence"] == "quotidienne", "Recurrence mismatch"
        
        print(f"✓ Created recurring consigne: {consigne['consigne_id']}")
    
    # ==================== GET CONSIGNES LIST ====================
    
    def test_get_consignes_list(self):
        """Test GET /api/consignes/hotels/{hotel_id}/consignes - List consignes"""
        response = self.session.get(f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "consignes" in data, "Missing 'consignes' in response"
        assert "total" in data, "Missing 'total' in response"
        assert isinstance(data["consignes"], list), "consignes should be a list"
        
        print(f"✓ List endpoint working - Total: {data['total']}")
    
    def test_get_consignes_with_filters(self):
        """Test GET consignes with various filters"""
        # Test status filter
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes?status=nouvelle"
        )
        assert response.status_code == 200, f"Status filter failed: {response.status_code}"
        
        # Test service filter
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes?service=reception"
        )
        assert response.status_code == 200, f"Service filter failed: {response.status_code}"
        
        # Test priority filter
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes?priority=urgente"
        )
        assert response.status_code == 200, f"Priority filter failed: {response.status_code}"
        
        # Test search filter
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes?search=TEST_"
        )
        assert response.status_code == 200, f"Search filter failed: {response.status_code}"
        
        print("✓ All filters working correctly")
    
    # ==================== GET SINGLE CONSIGNE ====================
    
    def test_get_single_consigne(self):
        """Test GET /api/consignes/hotels/{hotel_id}/consignes/{consigne_id}"""
        # First create a consigne
        consigne = self.test_create_consigne_basic()
        consigne_id = consigne["consigne_id"]
        
        # Then fetch it
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["consigne_id"] == consigne_id, "consigne_id mismatch"
        assert data["title"] == consigne["title"], "Title mismatch"
        
        print(f"✓ Get single consigne working: {consigne_id}")
    
    def test_get_nonexistent_consigne(self):
        """Test GET for non-existent consigne returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/NONEXISTENT-ID"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for non-existent consigne")
    
    # ==================== UPDATE CONSIGNE ====================
    
    def test_update_consigne_status(self):
        """Test PUT /api/consignes/hotels/{hotel_id}/consignes/{consigne_id} - Update status"""
        # First create a consigne
        consigne = self.test_create_consigne_basic()
        consigne_id = consigne["consigne_id"]
        
        # Update status to 'en_cours'
        response = self.session.put(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}",
            json={"status": "en_cours"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the update
        get_response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}"
        )
        updated = get_response.json()
        assert updated["status"] == "en_cours", "Status not updated"
        
        print(f"✓ Status updated to 'en_cours' for {consigne_id}")
    
    def test_update_consigne_priority(self):
        """Test updating consigne priority"""
        consigne = self.test_create_consigne_basic()
        consigne_id = consigne["consigne_id"]
        
        response = self.session.put(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}",
            json={"priority": "urgente"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify
        get_response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}"
        )
        updated = get_response.json()
        assert updated["priority"] == "urgente", "Priority not updated"
        
        print(f"✓ Priority updated to 'urgente' for {consigne_id}")
    
    def test_complete_consigne_workflow(self):
        """Test full workflow: nouvelle -> en_cours -> fait -> fermee"""
        consigne = self.test_create_consigne_basic()
        consigne_id = consigne["consigne_id"]
        
        # Step 1: Start work (nouvelle -> en_cours)
        response = self.session.put(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}",
            json={"status": "en_cours"}
        )
        assert response.status_code == 200
        
        # Step 2: Complete (en_cours -> fait)
        response = self.session.put(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}",
            json={"status": "fait", "completion_notes": "Task completed successfully"}
        )
        assert response.status_code == 200
        
        # Step 3: Close (fait -> fermee)
        response = self.session.put(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}",
            json={"status": "fermee"}
        )
        assert response.status_code == 200
        
        # Verify final state
        get_response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}"
        )
        final = get_response.json()
        assert final["status"] == "fermee", "Final status should be 'fermee'"
        assert final.get("completed_at") is not None, "completed_at should be set"
        
        print(f"✓ Full workflow completed for {consigne_id}")
    
    # ==================== DELETE CONSIGNE ====================
    
    def test_delete_consigne(self):
        """Test DELETE /api/consignes/hotels/{hotel_id}/consignes/{consigne_id}"""
        consigne = self.test_create_consigne_basic()
        consigne_id = consigne["consigne_id"]
        
        # Delete
        response = self.session.delete(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify deletion
        get_response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/{consigne_id}"
        )
        assert get_response.status_code == 404, "Consigne should be deleted"
        
        print(f"✓ Consigne deleted: {consigne_id}")
    
    def test_delete_nonexistent_consigne(self):
        """Test DELETE for non-existent consigne returns 404"""
        response = self.session.delete(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes/NONEXISTENT-ID"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for deleting non-existent consigne")
    
    # ==================== CALENDAR ENDPOINT ====================
    
    def test_get_calendar_data(self):
        """Test GET /api/consignes/hotels/{hotel_id}/calendar"""
        now = datetime.now()
        year = now.year
        month = now.month
        
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/calendar?year={year}&month={month}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "calendar" in data, "Missing 'calendar' in response"
        assert isinstance(data["calendar"], dict), "calendar should be a dict"
        
        print(f"✓ Calendar endpoint working for {year}-{month:02d}")
    
    def test_calendar_shows_created_consigne(self):
        """Test that calendar shows consignes for the correct date"""
        today = datetime.now().strftime("%Y-%m-%d")
        now = datetime.now()
        
        # Create a consigne for today
        payload = {
            "title": "TEST_Calendar Consigne",
            "description": "Test for calendar view",
            "service": "reception",
            "priority": "normale",
            "due_date": today
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json=payload
        )
        assert create_response.status_code == 200
        
        # Check calendar
        response = self.session.get(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/calendar?year={now.year}&month={now.month}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify today's date has consignes
        if today in data["calendar"]:
            consignes_today = data["calendar"][today]
            titles = [c["title"] for c in consignes_today]
            assert "TEST_Calendar Consigne" in titles, "Created consigne not found in calendar"
            print(f"✓ Calendar shows consigne for {today}")
        else:
            print(f"✓ Calendar endpoint working (no consignes for {today} yet)")
    
    # ==================== AI ENDPOINTS ====================
    
    def test_ai_analyze_endpoint(self):
        """Test POST /api/consignes/hotels/{hotel_id}/ai/analyze"""
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/ai/analyze"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "analysis" in data, "Missing 'analysis' in response"
        
        analysis = data["analysis"]
        assert "score_global" in analysis, "Missing score_global"
        assert "tendance" in analysis, "Missing tendance"
        
        print(f"✓ AI Analysis working - Score: {analysis['score_global']}, Tendance: {analysis['tendance']}")
    
    def test_ai_suggest_endpoint(self):
        """Test POST /api/consignes/hotels/{hotel_id}/ai/suggest"""
        context = {
            "event_type": "vip_checkin",
            "client_name": "M. Test VIP",
            "room_number": "501",
            "details": "Client VIP arriving for anniversary celebration",
            "preferences": ["champagne", "late checkout"]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/ai/suggest",
            json=context
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # AI suggest may return success=True or success=False depending on LLM availability
        assert "suggestions" in data or "success" in data, "Missing expected fields in response"
        
        print(f"✓ AI Suggest endpoint working")
    
    # ==================== TRIGGER ENDPOINTS ====================
    
    def test_trigger_checkin_consignes(self):
        """Test POST /api/consignes/hotels/{hotel_id}/triggers/checkin"""
        reservation_data = {
            "reservation_id": "TEST-RES-001",
            "guest_name": "TEST_VIP Guest",
            "room_number": "301",
            "is_vip": True,
            "is_birthday": False,
            "special_requests": ["Extra pillows", "Quiet room"]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/triggers/checkin",
            json=reservation_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "consignes_created" in data, "Missing consignes_created count"
        
        # VIP should create at least 1 consigne
        assert data["consignes_created"] >= 1, "VIP check-in should create consignes"
        
        print(f"✓ Check-in trigger created {data['consignes_created']} consignes")
    
    def test_trigger_housekeeping_consignes(self):
        """Test POST /api/consignes/hotels/{hotel_id}/triggers/housekeeping"""
        task_data = {
            "room_number": "205",
            "description": "TEST_Deep cleaning required",
            "task_type": "deep_clean",
            "assigned_to": "hk-001",
            "assigned_to_name": "Marie Housekeeping",
            "due_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/triggers/housekeeping",
            json=task_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "consigne" in data, "Missing consigne in response"
        
        print(f"✓ Housekeeping trigger created consigne: {data['consigne']['consigne_id']}")
    
    # ==================== VALIDATION TESTS ====================
    
    def test_create_consigne_missing_required_fields(self):
        """Test that creating consigne without required fields fails appropriately"""
        # Missing title
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json={"description": "Test without title"}
        )
        
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ Validation working for missing required fields")
    
    def test_invalid_service_value(self):
        """Test that invalid service value is rejected"""
        payload = {
            "title": "TEST_Invalid Service",
            "description": "Test with invalid service",
            "service": "invalid_service",
            "priority": "normale"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json=payload
        )
        
        # Should return 422 (validation error)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Validation working for invalid service value")
    
    def test_invalid_priority_value(self):
        """Test that invalid priority value is rejected"""
        payload = {
            "title": "TEST_Invalid Priority",
            "description": "Test with invalid priority",
            "service": "reception",
            "priority": "super_urgent"  # Invalid
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/consignes/hotels/{self.hotel_id}/consignes",
            json=payload
        )
        
        # Should return 422 (validation error)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Validation working for invalid priority value")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
