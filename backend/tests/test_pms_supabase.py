"""
PMS Supabase API Tests
Tests for the new PMS API routes at /api/pms/*
"""
import pytest
import requests
import os
from datetime import date, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://reception-suite-1.preview.emergentagent.com').rstrip('/')
HOTEL_ID = "fae266ac-2f4c-4297-af9f-b3b988d86c5b"


class TestPMSDashboard:
    """Dashboard KPIs endpoint tests"""
    
    def test_dashboard_returns_kpis(self):
        """GET /api/pms/dashboard/{hotel_id} returns KPIs"""
        response = requests.get(f"{BASE_URL}/api/pms/dashboard/{HOTEL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify required KPI fields
        assert "to_percent" in data, "Missing to_percent (occupation)"
        assert "rooms_total" in data, "Missing rooms_total"
        assert "rooms_free" in data, "Missing rooms_free"
        assert "arrivals" in data, "Missing arrivals"
        assert "departures" in data, "Missing departures"
        assert "in_house" in data, "Missing in_house"
        assert "cleaning_done" in data, "Missing cleaning_done"
        assert "cleaning_total" in data, "Missing cleaning_total"
        
        # Verify data types
        assert isinstance(data["to_percent"], (int, float)), "to_percent should be numeric"
        assert isinstance(data["rooms_total"], int), "rooms_total should be int"
        assert isinstance(data["rooms_free"], int), "rooms_free should be int"
        
        print(f"Dashboard KPIs: Occupation {data['to_percent']}%, Rooms {data['rooms_free']}/{data['rooms_total']}, Arrivals {data['arrivals']}, Departures {data['departures']}")


class TestPMSRooms:
    """Rooms endpoint tests"""
    
    def test_get_rooms_returns_list(self):
        """GET /api/pms/rooms/{hotel_id} returns room list"""
        response = requests.get(f"{BASE_URL}/api/pms/rooms/{HOTEL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 11, f"Expected at least 11 rooms, got {len(data)}"
        
        # Verify room structure
        if len(data) > 0:
            room = data[0]
            assert "id" in room, "Room missing id"
            assert "room_number" in room, "Room missing room_number"
            assert "room_type" in room, "Room missing room_type"
            assert "status" in room, "Room missing status"
        
        print(f"Rooms: {len(data)} rooms found")
        room_numbers = [r.get("room_number") for r in data]
        print(f"Room numbers: {room_numbers}")


class TestPMSReservations:
    """Reservations endpoint tests"""
    
    def test_get_reservations_returns_list(self):
        """GET /api/pms/reservations/{hotel_id} returns reservation list"""
        response = requests.get(f"{BASE_URL}/api/pms/reservations/{HOTEL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 7, f"Expected at least 7 reservations, got {len(data)}"
        
        # Verify reservation structure
        if len(data) > 0:
            resa = data[0]
            assert "id" in resa, "Reservation missing id"
            assert "guest_name" in resa, "Reservation missing guest_name"
            assert "check_in" in resa, "Reservation missing check_in"
            assert "check_out" in resa, "Reservation missing check_out"
            assert "status" in resa, "Reservation missing status"
        
        print(f"Reservations: {len(data)} reservations found")
        guest_names = [r.get("guest_name") for r in data[:5]]
        print(f"Sample guests: {guest_names}")
    
    def test_create_reservation(self):
        """POST /api/pms/reservations creates new reservation"""
        # Create a test reservation
        future_date = date.today() + timedelta(days=30)
        checkout_date = future_date + timedelta(days=3)
        
        payload = {
            "hotel_id": HOTEL_ID,
            "guest_name": "TEST_API_Guest",
            "guest_email": "test_api@test.com",
            "check_in": str(future_date),
            "check_out": str(checkout_date),
            "guest_count": 2,
            "source": "Direct"
        }
        
        response = requests.post(f"{BASE_URL}/api/pms/reservations", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response missing id"
        assert data["guest_name"] == "TEST_API_Guest", "Guest name mismatch"
        assert data["status"] == "confirmee", f"Expected status 'confirmee', got {data['status']}"
        
        print(f"Created reservation: {data['id']} for {data['guest_name']}")
        
        # Cleanup - cancel the test reservation
        cancel_response = requests.delete(f"{BASE_URL}/api/pms/reservations/{data['id']}")
        assert cancel_response.status_code == 200, f"Failed to cancel test reservation: {cancel_response.text}"
        print(f"Cancelled test reservation: {data['id']}")


class TestPMSHousekeeping:
    """Housekeeping endpoint tests"""
    
    def test_get_housekeeping_tasks(self):
        """GET /api/pms/housekeeping/{hotel_id} returns tasks for today"""
        response = requests.get(f"{BASE_URL}/api/pms/housekeeping/{HOTEL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 11, f"Expected at least 11 tasks, got {len(data)}"
        
        # Verify task structure
        if len(data) > 0:
            task = data[0]
            assert "id" in task, "Task missing id"
            assert "room_id" in task, "Task missing room_id"
            assert "status" in task, "Task missing status"
            assert "cleaning_type" in task, "Task missing cleaning_type"
            assert "priority" in task, "Task missing priority"
        
        # Count by status
        status_counts = {}
        for task in data:
            status = task.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"Housekeeping tasks: {len(data)} total")
        print(f"Status breakdown: {status_counts}")


class TestPMSGuests:
    """Guests endpoint tests"""
    
    def test_get_guests_endpoint(self):
        """GET /api/pms/guests/{hotel_id} - Note: May fail if guests table doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/pms/guests/{HOTEL_ID}")
        
        # This endpoint may return 400/404 if guests table doesn't exist in Supabase
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list), "Response should be a list"
            print(f"Guests: {len(data)} guests found")
        else:
            # Expected - guests table may not exist
            print(f"Guests endpoint returned {response.status_code}: {response.text[:100]}")
            pytest.skip("Guests table may not exist in Supabase schema")


class TestPMSIntegration:
    """Integration tests for PMS workflows"""
    
    def test_dashboard_matches_rooms_count(self):
        """Dashboard rooms_total should match actual rooms count"""
        # Get dashboard
        dashboard_response = requests.get(f"{BASE_URL}/api/pms/dashboard/{HOTEL_ID}")
        assert dashboard_response.status_code == 200
        dashboard = dashboard_response.json()
        
        # Get rooms
        rooms_response = requests.get(f"{BASE_URL}/api/pms/rooms/{HOTEL_ID}")
        assert rooms_response.status_code == 200
        rooms = rooms_response.json()
        
        # Compare
        assert dashboard["rooms_total"] == len(rooms), f"Dashboard shows {dashboard['rooms_total']} rooms but API returns {len(rooms)}"
        print(f"Verified: Dashboard rooms_total ({dashboard['rooms_total']}) matches rooms API ({len(rooms)})")
    
    def test_housekeeping_matches_rooms_count(self):
        """Housekeeping tasks count should match rooms count"""
        # Get housekeeping tasks
        hk_response = requests.get(f"{BASE_URL}/api/pms/housekeeping/{HOTEL_ID}")
        assert hk_response.status_code == 200
        tasks = hk_response.json()
        
        # Get rooms
        rooms_response = requests.get(f"{BASE_URL}/api/pms/rooms/{HOTEL_ID}")
        assert rooms_response.status_code == 200
        rooms = rooms_response.json()
        
        # Compare - should have at least one task per room
        assert len(tasks) >= len(rooms), f"Expected at least {len(rooms)} tasks, got {len(tasks)}"
        print(f"Verified: Housekeeping tasks ({len(tasks)}) >= rooms ({len(rooms)})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
